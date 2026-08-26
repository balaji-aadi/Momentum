/**
 * WorkerAutoScaler - Abstract Multi-Worker Auto-Scaling Decision Engine
 * (Phase 13 Dynamic Auto-Scaling Module)
 * 
 * Computes target worker capacity based on queue backlog metrics and delegates worker lifecycle
 * management to an abstract IWorkerPoolDriver implementation.
 */
export class WorkerAutoScaler {
  constructor({ workerDriver = null, queue = null, config = {} } = {}) {
    this.driver = workerDriver;
    this.queue = queue;
    this.config = {
      minWorkers: Number(process.env.JUDGE_MIN_WORKERS || 2),
      maxWorkers: Number(process.env.JUDGE_MAX_WORKERS || 20),
      scaleUpWindowSec: Number(process.env.JUDGE_SCALE_UP_WINDOW_SEC || 10),
      scaleDownIdleSec: Number(process.env.JUDGE_SCALE_DOWN_IDLE_SEC || 30),
      cooldownUpMs: 15000,
      cooldownDownMs: 60000,
      maxScaleUpStep: 4,
      maxScaleDownStep: 2,
      ...config
    };

    this.lastScaleTime = 0;
    this.lastScaleDirection = null; // 'UP' | 'DOWN' | null
    this.idleStartTime = null;
    this.timer = null;
  }

  async calculateTotalExecutionSlots() {
    if (!this.driver) return 10;
    const workers = await this.driver.getActiveWorkers();
    if (!workers || workers.length === 0) return 10;
    return workers.reduce((sum, w) => sum + (w.maxConcurrency || 5), 0);
  }

  async evaluateScalingCycle() {
    if (process.env.JUDGE_AUTOSCALING_ENABLED === 'false' || !this.driver) {
      return { action: 'NO_OP', targetWorkers: await this.driver?.getActiveWorkerCount() || 2 };
    }

    try {
      const activeWorkerCount = await this.driver.getActiveWorkerCount();
      const totalExecutionSlots = await this.calculateTotalExecutionSlots();
      const now = Date.now();

      let queueDepth = 0;
      if (this.queue && typeof this.queue.getMetrics === 'function') {
        const metrics = await this.queue.getMetrics();
        queueDepth = metrics.queued || 0;
      }

      // Check Scale-Up Triggers: queue backlog > 80% of total slot capacity
      const isScaleUpRequired = queueDepth > (totalExecutionSlots * 0.80);

      if (isScaleUpRequired) {
        this.idleStartTime = null;
        if (now - this.lastScaleTime < this.config.cooldownUpMs) {
          return { action: 'COOLDOWN', targetWorkers: activeWorkerCount };
        }

        const avgSlotPerWorker = totalExecutionSlots > 0 ? (totalExecutionSlots / activeWorkerCount) : 5;
        const neededWorkers = Math.ceil(queueDepth / avgSlotPerWorker);
        const desiredTarget = Math.min(this.config.maxWorkers, activeWorkerCount + Math.min(this.config.maxScaleUpStep, neededWorkers));

        if (desiredTarget > activeWorkerCount) {
          await this.driver.scaleTo(desiredTarget);
          this.lastScaleTime = now;
          this.lastScaleDirection = 'UP';
          return { action: 'SCALE_UP', targetWorkers: desiredTarget };
        }
      }

      // Check Scale-Down Triggers: queue depth === 0 for sustained idle period
      if (queueDepth === 0) {
        if (!this.idleStartTime) this.idleStartTime = now;
        const idleDurationSec = (now - this.idleStartTime) / 1000;

        if (idleDurationSec >= this.config.scaleDownIdleSec && activeWorkerCount > this.config.minWorkers) {
          if (now - this.lastScaleTime < this.config.cooldownDownMs) {
            return { action: 'COOLDOWN', targetWorkers: activeWorkerCount };
          }

          const desiredTarget = Math.max(this.config.minWorkers, activeWorkerCount - this.config.maxScaleDownStep);
          await this.driver.scaleTo(desiredTarget);
          this.lastScaleTime = now;
          this.lastScaleDirection = 'DOWN';
          return { action: 'SCALE_DOWN', targetWorkers: desiredTarget };
        }
      } else {
        this.idleStartTime = null;
      }

      return { action: 'NO_OP', targetWorkers: activeWorkerCount };
    } catch (err) {
      console.error("WorkerAutoScaler Error, maintaining baseline minWorkers:", err);
      try {
        await this.driver.scaleTo(this.config.minWorkers);
      } catch (e) {
        // Ignore fallback errors
      }
      return { action: 'ERROR_FALLBACK', targetWorkers: this.config.minWorkers };
    }
  }

  startAutoScalingLoop(intervalMs = 15000) {
    if (this.timer) return;
    this.timer = setInterval(() => this.evaluateScalingCycle(), intervalMs);
  }

  stopAutoScalingLoop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
