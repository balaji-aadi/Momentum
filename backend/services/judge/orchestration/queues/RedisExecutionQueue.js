import { IExecutionQueue } from './IExecutionQueue.js';
import { MemoryExecutionQueue } from './MemoryExecutionQueue.js';
import { ExecutionJob } from '../ExecutionJob.js';

/**
 * RedisExecutionQueue - Production Redis Queue Adapter Interface
 * (Phase 11 Production Queue Driver)
 * 
 * Provides distributed Redis/BullMQ queue management for production worker clusters.
 * Gracefully falls back to MemoryExecutionQueue when Redis connection is unconfigured.
 */
export class RedisExecutionQueue extends IExecutionQueue {
  constructor({ redisClient = null, fallbackQueue = null } = {}) {
    super();
    this.redisClient = redisClient;
    this.fallback = fallbackQueue || new MemoryExecutionQueue();
    this.isRedisActive = Boolean(redisClient && redisClient.status === 'ready');
  }

  async enqueue(job) {
    if (!this.isRedisActive) {
      return this.fallback.enqueue(job);
    }
    const payload = typeof job.toJSON === 'function' ? job.toJSON() : job;
    const key = `sarthi:queue:${payload.priority === 'HIGH' ? 'high' : 'normal'}`;
    await this.redisClient.rpush(key, JSON.stringify(payload));
    await this.redisClient.hset('sarthi:jobs', payload.jobId, JSON.stringify(payload));
  }

  async dequeue(workerId = 'worker_redis') {
    if (!this.isRedisActive) {
      return this.fallback.dequeue(workerId);
    }
    let raw = await this.redisClient.lpop('sarthi:queue:high');
    if (!raw) {
      raw = await this.redisClient.lpop('sarthi:queue:normal');
    }
    if (!raw) return null;
    const json = JSON.parse(raw);
    const job = ExecutionJob.fromJSON(json);
    job.state = 'CLAIMED';
    await this.redisClient.hset('sarthi:jobs', job.jobId, JSON.stringify(job.toJSON()));
    return job;
  }

  async ack(jobId) {
    if (!this.isRedisActive) {
      return this.fallback.ack(jobId);
    }
    await this.redisClient.hdel('sarthi:active', jobId);
  }

  async nack(jobId, reason) {
    if (!this.isRedisActive) {
      return this.fallback.nack(jobId, reason);
    }
    await this.redisClient.hdel('sarthi:active', jobId);
  }

  async getMetrics() {
    if (!this.isRedisActive) {
      return this.fallback.getMetrics();
    }
    const highLen = await this.redisClient.llen('sarthi:queue:high');
    const normLen = await this.redisClient.llen('sarthi:queue:normal');
    const totalJobs = await this.redisClient.hlen('sarthi:jobs');
    return {
      queued: highLen + normLen,
      active: 0,
      total: totalJobs
    };
  }

  async getJob(jobId) {
    if (!this.isRedisActive) {
      return this.fallback.getJob(jobId);
    }
    const raw = await this.redisClient.hget('sarthi:jobs', jobId);
    if (!raw) return null;
    const json = JSON.parse(raw);
    return ExecutionJob.fromJSON(json);
  }

  async updateJob(job) {
    if (!this.isRedisActive) {
      return this.fallback.updateJob(job);
    }
    if (job && job.jobId) {
      const payload = typeof job.toJSON === 'function' ? job.toJSON() : job;
      await this.redisClient.hset('sarthi:jobs', payload.jobId, JSON.stringify(payload));
    }
  }
}
