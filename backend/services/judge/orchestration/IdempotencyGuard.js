import crypto from 'crypto';

/**
 * IdempotencyGuard - Dual-Tier Request Deduplication & Duplicate Execution Guard
 * (Phase 11 Idempotency Guard)
 * 
 * 1. Primary (Client-Driven): Inspects Idempotency-Key HTTP header (UUIDv4) with 60s TTL.
 * 2. Secondary (Double-Click Fallback): Computes 5s (RUN) or 10s (SUBMIT) sliding window hash key:
 *    sha256(userId + problemId + language + code + executionType + packageHash + timeBucket)
 */
export class IdempotencyGuard {
  constructor({ defaultTtlSeconds = 60 } = {}) {
    this.defaultTtlSeconds = defaultTtlSeconds;
    // Fast in-memory cache for local dev / single node (Redis queue adapter mirrors this in prod)
    this.store = new Map();
  }

  /**
   * Computes deduplication key for a job request.
   * 
   * @param {Object} params
   * @param {string} [params.clientKey] Header 'Idempotency-Key'
   * @param {string} [params.userId]
   * @param {string} [params.problemId]
   * @param {string} [params.language]
   * @param {string} [params.code]
   * @param {string} [params.executionType] 'RUN' | 'SUBMIT'
   * @param {string} [params.packageHash]
   * @param {number} [params.windowSeconds=5]
   * @returns {string}
   */
  static computeKey({ clientKey, userId, problemId, language, code, executionType = 'RUN', packageHash = '', windowSeconds = 5 }) {
    if (clientKey && typeof clientKey === 'string' && clientKey.trim().length > 0) {
      return `idem_client_${clientKey.trim()}`;
    }

    const type = (executionType || 'RUN').toUpperCase();
    const timeBucket = Math.floor(Date.now() / (windowSeconds * 1000));
    const payload = `${userId || 'anon'}:${problemId || 'none'}:${language || 'js'}:${code || ''}:${type}:${packageHash}:${timeBucket}`;
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    return `idem_window_${type}_${hash}`;
  }

  /**
   * Checks if an idempotency key is active or completed in cache.
   * 
   * @param {string} key
   * @returns {Object|null} Cached job metadata or null if miss
   */
  async check(key) {
    if (!key) return null;
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.jobRecord;
  }

  /**
   * Registers a job record under an idempotency key with TTL.
   * 
   * @param {string} key
   * @param {Object} jobRecord
   * @param {number} [ttlSeconds]
   */
  async register(key, jobRecord, ttlSeconds) {
    if (!key) return;
    const ttl = (ttlSeconds || this.defaultTtlSeconds) * 1000;
    this.store.set(key, {
      jobRecord,
      expiresAt: Date.now() + ttl
    });
  }

  /**
   * Clears expired keys from memory.
   */
  purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const defaultIdempotencyGuard = new IdempotencyGuard();
