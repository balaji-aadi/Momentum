import { IWorkerPoolDriver } from './IWorkerPoolDriver.js';
import { JudgeWorker } from '../../JudgeWorker.js';

/**
 * InProcessWorkerPoolDriver - Local Node.js JudgeWorker Pool Driver
 * (Phase 13 In-Process Worker Pool Driver Implementation)
 */
export class InProcessWorkerPoolDriver extends IWorkerPoolDriver {
  constructor({ queue = null, workerConfig = {} } = {}) {
    super();
    this.queue = queue;
    this.workerConfig = workerConfig;
    this.workers = new Map(); // workerId -> JudgeWorker instance
    this.counter = 0;
  }

  async getActiveWorkerCount() {
    return this.workers.size;
  }

  async getWorkerMetrics() {
    const maxConc = this.workerConfig.maxConcurrency || 5;
    return {
      activeWorkers: this.workers.size,
      totalSlots: this.workers.size * maxConc,
      driverType: 'in_process'
    };
  }

  async getActiveWorkers() {
    return Array.from(this.workers.values());
  }

  async scaleTo(targetWorkerCount) {
    const currentCount = this.workers.size;
    const target = Math.max(1, targetWorkerCount);

    if (target === currentCount) return currentCount;

    if (target > currentCount) {
      const toAdd = target - currentCount;
      for (let i = 0; i < toAdd; i++) {
        this.counter++;
        const workerId = `worker_auto_${this.counter}`;
        const worker = new JudgeWorker({
          workerId,
          queue: this.queue,
          maxConcurrency: this.workerConfig.maxConcurrency || 5,
          pollIntervalMs: this.workerConfig.pollIntervalMs || 10
        });
        worker.start();
        this.workers.set(workerId, worker);
      }
    } else {
      const toRemove = currentCount - target;
      const workerIds = Array.from(this.workers.keys());
      for (let i = 0; i < toRemove; i++) {
        const idToRemove = workerIds.pop();
        if (idToRemove) {
          await this.terminateWorker(idToRemove);
        }
      }
    }

    const action = target > currentCount ? 'SCALE_UP' : (target < currentCount ? 'SCALE_DOWN' : 'NO_CHANGE');
    return {
      action,
      activeWorkers: this.workers.size
    };
  }

  async terminateWorker(workerId) {
    if (this.workers.has(workerId)) {
      const worker = this.workers.get(workerId);
      worker.stop();
      this.workers.delete(workerId);
      return true;
    }
    return false;
  }
}
