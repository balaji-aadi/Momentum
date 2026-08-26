import v8 from 'v8';

/**
 * BackpressureManager - Multi-Factor Gateway Overload & Load-Shedding Engine
 * (Phase 13 Capacity Management Module)
 * 
 * Computes composite system health index H_sys and determines early load shedding actions
 * (ACCEPT, THROTTLE, SHED) to protect worker pool and Redis queue memory from burst spikes.
 */
export class BackpressureManager {
  constructor({ queue = null, metricsCollector = null, config = {} } = {}) {
    this.queue = queue;
    this.metricsCollector = metricsCollector;
    this.config = {
      wq: Number(process.env.JUDGE_BACKPRESSURE_WQ || 0.35),
      wt: Number(process.env.JUDGE_BACKPRESSURE_WT || 0.35),
      wu: Number(process.env.JUDGE_BACKPRESSURE_WU || 0.15),
      wm: Number(process.env.JUDGE_BACKPRESSURE_WM || 0.15),
      maxQueue: Number(process.env.JUDGE_MAX_QUEUE_CAPACITY || 1000),
      maxWaitSloMs: Number(process.env.JUDGE_MAX_QUEUE_WAIT_SLO_MS || 10000),
      throttleThreshold: Number(process.env.JUDGE_BACKPRESSURE_THROTTLE_THRES || 0.70),
      shedThreshold: Number(process.env.JUDGE_BACKPRESSURE_SHED_THRES || 0.90),
      ...config
    };
  }

  async evaluateHealth({ activeWorkerCount = 2, totalActiveSlots = 10, p95QueueWaitMs = 0 } = {}) {
    if (process.env.JUDGE_BACKPRESSURE_ENABLED === 'false') {
      return { state: 'ACCEPT', score: 0, retryAfterSeconds: 0 };
    }

    let queueDepth = 0;
    if (this.queue && typeof this.queue.getMetrics === 'function') {
      const metrics = await this.queue.getMetrics();
      queueDepth = metrics.queued || 0;
    }

    // 1. Queue Depth Factor (0.0 .. 1.0)
    const fQueue = Math.min(1.0, queueDepth / this.config.maxQueue);

    // 2. Queue Wait Time Factor (0.0 .. 1.0)
    const fWait = Math.min(1.0, p95QueueWaitMs / this.config.maxWaitSloMs);

    // 3. Worker Slot Utilization Factor (0.0 .. 1.0)
    let workerActiveSlots = 0;
    if (this.queue && this.queue.activeJobs) {
      workerActiveSlots = this.queue.activeJobs.size || 0;
    }
    const fWorker = totalActiveSlots > 0 ? Math.min(1.0, workerActiveSlots / totalActiveSlots) : 0;

    // 4. Node Heap Memory Factor (0.0 .. 1.0)
    const heapStats = v8.getHeapStatistics();
    const fMem = Math.min(1.0, heapStats.used_heap_size / heapStats.heap_size_limit);

    // Composite System Health Index Score
    const score = (this.config.wq * fQueue) +
                  (this.config.wt * fWait) +
                  (this.config.wu * fWorker) +
                  (this.config.wm * fMem);

    if (score >= this.config.shedThreshold || queueDepth >= this.config.maxQueue || p95QueueWaitMs >= this.config.maxWaitSloMs) {
      return {
        state: 'SHED',
        score: Number(score.toFixed(3)),
        retryAfterSeconds: 5,
        reason: 'System capacity overloaded (H_sys breach)'
      };
    }

    if (score >= this.config.throttleThreshold) {
      return {
        state: 'THROTTLE',
        score: Number(score.toFixed(3)),
        retryAfterSeconds: 0,
        reason: 'Soft capacity threshold reached'
      };
    }

    return {
      state: 'ACCEPT',
      score: Number(score.toFixed(3)),
      retryAfterSeconds: 0
    };
  }
}
