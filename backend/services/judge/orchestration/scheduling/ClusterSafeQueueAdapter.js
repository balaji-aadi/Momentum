import { IExecutionQueue } from '../queues/IExecutionQueue.js';
import { JobStateMachine } from '../JobStateMachine.js';
import { ClusterSafeFairShareScheduler } from './ClusterSafeFairShareScheduler.js';

/**
 * ClusterSafeQueueAdapter - Redis Cluster Hash-Tag Ingestion Adapter
 * (Phase 15 Cluster Infrastructure Module - Stage 15.1)
 * 
 * Enforces Redis Hash Tags {tenantId} on queue keys to guarantee Redis Cluster hash-slot alignment.
 * Preserves full compatibility with Phase 13 queue ingestion contracts.
 */
export class ClusterSafeQueueAdapter extends IExecutionQueue {
  constructor({ redisClient = null, memoryFallbackQueue = null, scheduler = null } = {}) {
    super();
    this.redis = redisClient;
    this.fallbackQueue = memoryFallbackQueue;
    this.scheduler = scheduler || new ClusterSafeFairShareScheduler({ redisClient, queueAdapter: this });
    this.tenantQueues = new Map(); // tenantKey -> array of jobs
    this.tenantRings = new Map();  // priority -> array of tenantIds
    this.allJobs = new Map();      // jobId -> ExecutionJob
    this.activeJobs = new Map();   // jobId -> active record
  }

  async enqueue(job) {
    if (!job) throw new Error("ClusterSafeQueueAdapter.enqueue: Valid ExecutionJob required.");

    const userId = job.userId ? String(job.userId) : 'anonymous';
    const priority = (job.priority || 'NORMAL').toLowerCase();

    JobStateMachine.transition(job, JobStateMachine.STATES.QUEUED);
    this.allJobs.set(job.jobId, job);

    if (this.redis && this.redis.status === 'ready') {
      // Redis Hash Tag Alignment: {userId} forces hash-slot mapping for single tenant
      const queueKey = `sarthi:queue:{${userId}}:${priority}`;
      const ringKey = `sarthi:tenant_ring:${priority}`;
      const payload = typeof job.toJSON === 'function' ? JSON.stringify(job.toJSON()) : JSON.stringify(job);

      await this.redis.rpush(queueKey, payload);

      // Maintain deterministic tenant ring
      const currentRing = await this.redis.lrange(ringKey, 0, -1);
      if (!currentRing.includes(userId)) {
        await this.redis.rpush(ringKey, userId);
      }
      return true;
    }

    // In-Memory Fallback Implementation (Preserves Phase 13 Ingestion logic)
    const tenantKey = `${userId}:${priority}`;
    if (!this.tenantQueues.has(tenantKey)) {
      this.tenantQueues.set(tenantKey, []);
    }
    this.tenantQueues.get(tenantKey).push(job);

    if (!this.tenantRings.has(priority)) {
      this.tenantRings.set(priority, []);
    }
    const ring = this.tenantRings.get(priority);
    if (!ring.includes(userId)) {
      ring.push(userId);
    }

    return true;
  }

  async dequeue(workerId) {
    const job = await this.scheduler.dequeueNextJob(this, workerId, 10);
    if (job) {
      this.activeJobs.set(job.jobId, { job, workerId, dequeuedAt: Date.now() });
    }
    return job;
  }

  async updateJob(job) {
    if (!job) return false;
    this.allJobs.set(job.jobId, job);
    if (JobStateMachine.isTerminal(job.state)) {
      this.activeJobs.delete(job.jobId);
      if (job.userId) {
        this.scheduler.releaseTenantSlot(job.userId);
      }
    }
    return true;
  }

  async getJob(jobId) {
    return this.allJobs.get(jobId) || null;
  }

  async ack(jobId) {
    const record = this.activeJobs.get(jobId);
    if (record && record.job && record.job.userId) {
      this.scheduler.releaseTenantSlot(record.job.userId);
    }
    this.activeJobs.delete(jobId);
    return true;
  }

  async getMetrics() {
    let queued = 0;
    for (const [, list] of this.tenantQueues.entries()) {
      queued += list.length;
    }
    return { queued, active: this.activeJobs.size, completed: 0, failed: 0 };
  }
}
