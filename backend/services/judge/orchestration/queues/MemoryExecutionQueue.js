import { IExecutionQueue } from './IExecutionQueue.js';
import { JobStateMachine } from '../JobStateMachine.js';

/**
 * MemoryExecutionQueue - High-Performance In-Memory Priority Queue
 * (Phase 11 In-Memory Queue Driver)
 * 
 * Manages priority queues (HIGH for SUBMIT, NORMAL for RUN), claim locks,
 * and status tracking for unit testing & zero-dependency local development.
 */
export class MemoryExecutionQueue extends IExecutionQueue {
  constructor() {
    super();
    this.highPriorityQueue = [];
    this.normalPriorityQueue = [];
    this.activeJobs = new Map(); // jobId -> { job, workerId, claimedAt }
    this.allJobs = new Map();    // jobId -> job
  }

  async enqueue(job) {
    if (!job || !job.jobId) throw new Error("MemoryExecutionQueue: Valid ExecutionJob required.");

    JobStateMachine.transition(job, JobStateMachine.STATES.QUEUED);
    this.allJobs.set(job.jobId, job);

    if (job.priority === 'HIGH' || job.executionType === 'SUBMIT') {
      this.highPriorityQueue.push(job);
    } else {
      this.normalPriorityQueue.push(job);
    }
  }

  async dequeue(workerId = 'worker_default') {
    let job = this.highPriorityQueue.shift();
    if (!job) {
      job = this.normalPriorityQueue.shift();
    }

    if (!job) return null;

    JobStateMachine.transition(job, JobStateMachine.STATES.CLAIMED);
    this.activeJobs.set(job.jobId, {
      job,
      workerId,
      claimedAt: new Date().toISOString()
    });

    return job;
  }

  async ack(jobId) {
    this.activeJobs.delete(jobId);
  }

  async nack(jobId, reason) {
    this.activeJobs.delete(jobId);
    const job = this.allJobs.get(jobId);
    if (job && !JobStateMachine.isTerminal(job.state)) {
      job.error = reason || 'Job nacked';
    }
  }

  async getMetrics() {
    return {
      queued: this.highPriorityQueue.length + this.normalPriorityQueue.length,
      active: this.activeJobs.size,
      total: this.allJobs.size
    };
  }

  async getJob(jobId) {
    return this.allJobs.get(jobId) || null;
  }

  async updateJob(job) {
    if (job && job.jobId) {
      this.allJobs.set(job.jobId, job);
    }
  }

  clear() {
    this.highPriorityQueue = [];
    this.normalPriorityQueue = [];
    this.activeJobs.clear();
    this.allJobs.clear();
  }
}
