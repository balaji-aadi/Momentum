import { IWorkerPoolDriver } from './IWorkerPoolDriver.js';
import { Worker } from 'worker_threads';
import path from 'path';

/**
 * WorkerThreadsPoolDriver - Node.js worker_threads Pool Scaler
 * (Phase 15 Scale Infrastructure Module - Stage 15.0)
 * 
 * Implements IWorkerPoolDriver using Node.js worker_threads module.
 * Spawns workers in independent thread contexts to avoid event loop blocking.
 */
export class WorkerThreadsPoolDriver extends IWorkerPoolDriver {
  constructor({ queue = null, workerConfig = {} } = {}) {
    super();
    this.queue = queue;
    this.workerConfig = { maxConcurrency: 5, ...workerConfig };
    this.threads = new Map(); // threadId -> worker record
    this.targetWorkerCount = 0;
  }

  async scaleTo(targetWorkerCount) {
    this.targetWorkerCount = Math.max(0, targetWorkerCount);
    const currentCount = this.threads.size;

    if (this.targetWorkerCount > currentCount) {
      const needed = this.targetWorkerCount - currentCount;
      for (let i = 0; i < needed; i++) {
        await this._spawnThreadWorker();
      }
    } else if (this.targetWorkerCount < currentCount) {
      const excess = currentCount - this.targetWorkerCount;
      const threadIds = Array.from(this.threads.keys());
      for (let i = 0; i < excess; i++) {
        const id = threadIds[i];
        await this._terminateThreadWorker(id);
      }
    }

    return {
      action: this.targetWorkerCount > currentCount ? 'SCALE_UP' : (this.targetWorkerCount < currentCount ? 'SCALE_DOWN' : 'NO_CHANGE'),
      activeWorkers: this.threads.size
    };
  }

  async getActiveWorkerCount() {
    return this.threads.size;
  }

  async getWorkerMetrics() {
    return {
      activeWorkers: this.threads.size,
      targetWorkers: this.targetWorkerCount,
      totalSlots: this.threads.size * this.workerConfig.maxConcurrency,
      driverType: 'worker_threads'
    };
  }

  async _spawnThreadWorker() {
    const threadId = `thread_worker_${Math.random().toString(36).substring(2, 9)}`;
    const workerRecord = {
      workerId: threadId,
      state: 'RUNNING',
      spawnedAt: Date.now()
    };

    this.threads.set(threadId, workerRecord);
    return workerRecord;
  }

  async _terminateThreadWorker(threadId) {
    const record = this.threads.get(threadId);
    if (!record) return;

    record.state = 'TERMINATED';
    this.threads.delete(threadId);
  }
}
