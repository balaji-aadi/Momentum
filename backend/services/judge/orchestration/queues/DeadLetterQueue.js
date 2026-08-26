import { JobStateMachine } from '../JobStateMachine.js';

/**
 * DeadLetterQueue - Dead-Letter Queue Management Engine
 * (Phase 15 Cluster Infrastructure Module - Stage 15.1)
 * 
 * Manages jobs that have exhausted maximum retry attempts.
 * Quarantines failed jobs into sarthi:queue:dlq to prevent tenant queue clogging.
 */
export class DeadLetterQueue {
  constructor({ redisClient = null, shardId = '0' } = {}) {
    this.redis = redisClient;
    this.dlqKey = `sarthi:queue:dlq:{shard_${shardId}}`;
    this.memoryDlq = [];
  }

  async moveToDeadLetter(job, reason = 'MAX_RETRIES_EXCEEDED') {
    if (!job) throw new Error("DeadLetterQueue.moveToDeadLetter: Valid ExecutionJob required.");

    job.metadata = job.metadata || {};
    job.metadata.dlqReason = reason;
    job.metadata.movedToDlqAt = new Date().toISOString();

    JobStateMachine.transition(job, JobStateMachine.STATES.FAILED);

    const payload = typeof job.toJSON === 'function' ? JSON.stringify(job.toJSON()) : JSON.stringify(job);

    if (this.redis && this.redis.status === 'ready') {
      await this.redis.rpush(this.dlqKey, payload);
    } else {
      this.memoryDlq.push({ job, reason, timestamp: Date.now() });
    }

    return {
      jobId: job.jobId,
      status: 'DEAD_LETTERED',
      reason
    };
  }

  async getDeadLetterJobs(count = 50) {
    if (this.redis && this.redis.status === 'ready') {
      const rawJobs = await this.redis.lrange(this.dlqKey, 0, count - 1);
      return rawJobs.map(j => JSON.parse(j));
    }
    return this.memoryDlq.slice(0, count);
  }

  async getDeadLetterCount() {
    if (this.redis && this.redis.status === 'ready') {
      return await this.redis.llen(this.dlqKey);
    }
    return this.memoryDlq.length;
  }

  async clearDeadLetterQueue() {
    if (this.redis && this.redis.status === 'ready') {
      await this.redis.del(this.dlqKey);
    } else {
      this.memoryDlq = [];
    }
    return true;
  }
}
