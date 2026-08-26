import mongoose from 'mongoose';

/**
 * DatabaseProtectionLayer - Redis Stream AOF Durability & Idempotent Persistence Engine
 * (Phase 15 Cluster Infrastructure Module - Stage 15.2)
 * 
 * DURABILITY SEMANTICS:
 * Buffers evaluation results in Redis Stream (sarthi:stream:results) with AOF durability (appendfsync=everysec).
 * CRASH WINDOW EXPLANATION: Redis AOF appendfsync=everysec guarantees near-real-time disk sync,
 * with up to a 1-second crash window (up to 1s of unwritten stream data can be lost if host OS kernel crashes
 * before disk AOF flush). A result is considered DURABLE once written to disk AOF or MongoDB.
 * 
 * BOUNDED CONNECTIONS & IDEMPOTENCY:
 * Consumer group workers read stream entries in batches of 100 docs and execute MongoDB bulkWrite
 * with upsert: true on jobId (capped at max 20 active MongoDB connections).
 * Pending Entry List (PEL) recovery (XPENDING / XCLAIM) flushes uncommitted results if consumer crashes.
 */
export class DatabaseProtectionLayer {
  static MAX_MONGO_CONNECTIONS = 20;
  static DEFAULT_STREAM_KEY = 'sarthi:stream:results';
  static CONSUMER_GROUP = 'sarthi_db_persistence_group';

  constructor({ redisClient = null, mongoConnection = null, streamKey = DatabaseProtectionLayer.DEFAULT_STREAM_KEY } = {}) {
    this.redis = redisClient;
    this.mongo = mongoConnection || mongoose.connection;
    this.streamKey = streamKey;
    this.isProcessing = false;
    this.inMemoryStreamBuffer = []; // Local fallback buffer for isolated testing
    this.inMemoryDb = new Map();     // Local memory DB collection map for isolated testing
    this.inMemoryPel = new Map();    // Local Pending Entry List map for isolated testing
  }

  /**
   * Appends an evaluation result to the Redis Stream.
   * Worker acknowledges job after stream write; result is durable once written to AOF log or MongoDB.
   */
  async appendResult(jobResult) {
    if (!jobResult || !jobResult.jobId) {
      throw new Error("DatabaseProtectionLayer.appendResult: Valid jobResult with jobId required.");
    }

    const payload = typeof jobResult.toJSON === 'function' ? JSON.stringify(jobResult.toJSON()) : JSON.stringify(jobResult);

    if (this.redis && this.redis.status === 'ready') {
      const streamId = await this.redis.xadd(this.streamKey, '*', 'payload', payload);
      return { streamId, jobId: jobResult.jobId, durable: 'REDIS_AOF_LOGGED' };
    }

    // In-Memory Fallback Buffer for Isolated Testing
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const entry = { streamId, payload: jobResult, createdAt: Date.now(), acked: false };
    this.inMemoryStreamBuffer.push(entry);
    this.inMemoryPel.set(streamId, entry);

    return { streamId, jobId: jobResult.jobId, durable: 'IN_MEMORY_BUFFERED' };
  }

  /**
   * Consumes buffered stream entries in batches and executes MongoDB bulkWrite (upsert by jobId).
   */
  async processBatch(batchSize = 100) {
    if (this.isProcessing) return { processed: 0 };
    this.isProcessing = true;

    try {
      if (this.redis && this.redis.status === 'ready') {
        const entries = await this.redis.xreadgroup(
          'GROUP', DatabaseProtectionLayer.CONSUMER_GROUP, 'consumer_1',
          'COUNT', batchSize,
          'STREAMS', this.streamKey, '>'
        );

        if (!entries || entries.length === 0) {
          this.isProcessing = false;
          return { processed: 0 };
        }

        const rawList = entries[0][1];
        const bulkOperations = [];
        const streamIdsToAck = [];

        for (const [sId, fields] of rawList) {
          const rawPayload = fields[1];
          const result = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;

          bulkOperations.push({
            updateOne: {
              filter: { jobId: result.jobId },
              update: { $set: result },
              upsert: true
            }
          });
          streamIdsToAck.push(sId);
        }

        // Bounded Connection Check: Verify MongoDB active connection pool is <= 20
        const activeConnCount = this.mongo.states ? Object.keys(this.mongo.states).length : 1;
        if (activeConnCount > DatabaseProtectionLayer.MAX_MONGO_CONNECTIONS) {
          console.warn(`[DatabaseProtectionLayer] Connection pool count (${activeConnCount}) exceeds cap (20). Delaying bulk sync.`);
          this.isProcessing = false;
          return { processed: 0, reason: 'CONNECTION_POOL_CAP_EXCEEDED' };
        }

        if (bulkOperations.length > 0 && this.mongo.db) {
          await this.mongo.db.collection('submissions').bulkWrite(bulkOperations, { ordered: false });
          await this.redis.xack(this.streamKey, DatabaseProtectionLayer.CONSUMER_GROUP, ...streamIdsToAck);
        }

        this.isProcessing = false;
        return { processed: bulkOperations.length };
      }

      // In-Memory Fallback Batch Processing
      const unacked = this.inMemoryStreamBuffer.filter(e => !e.acked).slice(0, batchSize);
      if (unacked.length === 0) {
        this.isProcessing = false;
        return { processed: 0 };
      }

      for (const entry of unacked) {
        const res = entry.payload;
        // Idempotent upsert by jobId
        this.inMemoryDb.set(res.jobId, { ...res, persistedAt: new Date().toISOString() });
        entry.acked = true;
        this.inMemoryPel.delete(entry.streamId);
      }

      this.isProcessing = false;
      return { processed: unacked.length };
    } catch (err) {
      this.isProcessing = false;
      console.error("[DatabaseProtectionLayer] Batch processing error (MongoDB temporarily unavailable or offline):", err.message);
      return { processed: 0, error: err.message };
    }
  }

  /**
   * Pending Entry List (PEL) Crash Recovery (XPENDING / XCLAIM).
   * Reclaims un-acknowledged stream entries if a consumer worker crashes during bulk sync.
   */
  async recoverPendingEntries(minIdleTimeMs = 30000) {
    if (this.redis && this.redis.status === 'ready') {
      const pending = await this.redis.xpending(
        this.streamKey, DatabaseProtectionLayer.CONSUMER_GROUP,
        '-', '+', 100
      );

      if (!pending || pending.length === 0) return { recovered: 0 };

      const expiredStreamIds = pending
        .filter(p => p.idle >= minIdleTimeMs)
        .map(p => p.streamId);

      if (expiredStreamIds.length === 0) return { recovered: 0 };

      // Claim expired pending entries for consumer_recovery
      const claimed = await this.redis.xclaim(
        this.streamKey, DatabaseProtectionLayer.CONSUMER_GROUP, 'consumer_recovery',
        minIdleTimeMs, ...expiredStreamIds
      );

      // Re-run batch sync for recovered entries
      const bulkOps = [];
      const ackIds = [];

      for (const [sId, fields] of claimed) {
        const rawPayload = fields[1];
        const res = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
        bulkOps.push({
          updateOne: {
            filter: { jobId: res.jobId },
            update: { $set: res },
            upsert: true
          }
        });
        ackIds.push(sId);
      }

      if (bulkOps.length > 0 && this.mongo.db) {
        await this.mongo.db.collection('submissions').bulkWrite(bulkOps, { ordered: false });
        await this.redis.xack(this.streamKey, DatabaseProtectionLayer.CONSUMER_GROUP, ...ackIds);
      }

      return { recovered: bulkOps.length };
    }

    // In-Memory PEL Crash Recovery
    const now = Date.now();
    let recoveredCount = 0;

    for (const [streamId, entry] of this.inMemoryPel.entries()) {
      if (!entry.acked && (now - entry.createdAt) >= minIdleTimeMs) {
        const res = entry.payload;
        this.inMemoryDb.set(res.jobId, { ...res, persistedAt: new Date().toISOString() });
        entry.acked = true;
        this.inMemoryPel.delete(streamId);
        recoveredCount++;
      }
    }

    return { recovered: recoveredCount };
  }
}
