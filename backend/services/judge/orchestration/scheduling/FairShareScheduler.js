import { ExecutionJob } from '../ExecutionJob.js';
import { JobStateMachine } from '../JobStateMachine.js';
import { WorkerLeaseManager } from '../WorkerLeaseManager.js';
import { CapacityAwareRouter } from '../capacity/CapacityAwareRouter.js';
import { ExecutionStageProfiler } from '../../observability/ExecutionStageProfiler.js';

/**
 * FairShareScheduler - Multi-Tenant Priority Scheduler & Atomic Lease Dispatcher
 * (Phase 13 Multi-Tenant Fair-Share Priority Scheduler)
 * 
 * Enforces 1. Priority Class -> 2. Interleaved Tenant Round-Robin -> 3. FIFO Queue Age.
 * Immediately delegates lease issuance to Phase 12 WorkerLeaseManager upon atomic job pop.
 */
export class FairShareScheduler {
  constructor({ redisClient = null, queueAdapter = null } = {}) {
    this.redis = redisClient;
    this.adapter = queueAdapter;
    this.activeTenantSlotCounts = new Map(); // tenantId -> count of active running slots
  }

  async dequeueNextJob(adapter, workerId, totalExecutionSlots = 10) {
    const queue = adapter || this.adapter;
    if (!queue) return null;

    const priorities = ['high', 'normal'];

    for (const priority of priorities) {
      const job = await this._dequeueFromPriority(queue, workerId, priority, totalExecutionSlots);
      if (job) return job;
    }

    return null;
  }

  async _dequeueFromPriority(queue, workerId, priority, totalExecutionSlots) {
    const tenantRatio = Number(process.env.JUDGE_MAX_TENANT_CAPACITY_RATIO || 0.25);
    const tenantMaxSlots = Math.max(1, Math.ceil(totalExecutionSlots * tenantRatio));

    // Redis Atomic Multi-Tenant Dequeue
    if (this.redis && this.redis.status === 'ready') {
      const ringKey = `sarthi:queue:tenant_ring:${priority}`;
      const ringLength = await this.redis.llen(ringKey);

      if (ringLength === 0) return null;

      const isContended = ringLength >= 2;

      for (let i = 0; i < ringLength; i++) {
        // Atomic ring cursor rotation
        const selectedTenantId = await this.redis.rpoplpush(ringKey, ringKey);
        if (!selectedTenantId) continue;

        const currentActive = this.activeTenantSlotCounts.get(selectedTenantId) || 0;
        if (isContended && currentActive >= tenantMaxSlots) {
          continue; // Skip tenant if cap reached during contention
        }

        const queueKey = `sarthi:queue:tenant:${selectedTenantId}:${priority}`;
        const rawJobJson = await this.redis.lpop(queueKey);

        if (!rawJobJson) {
          // Remove empty tenant from ring
          await this.redis.lrem(ringKey, 0, selectedTenantId);
          continue;
        }

        const jobJson = typeof rawJobJson === 'string' ? JSON.parse(rawJobJson) : rawJobJson;
        const job = ExecutionJob.fromJSON(jobJson);

        // AUTHORITATIVE LEASE ISSUANCE VIA PHASE 12 WorkerLeaseManager
        ExecutionStageProfiler.startStage(job, ExecutionStageProfiler.STAGES.WORKER_LEASE_ACQUISITION);
        WorkerLeaseManager.issueLease(job, workerId);
        ExecutionStageProfiler.endStage(job, ExecutionStageProfiler.STAGES.WORKER_LEASE_ACQUISITION);
        JobStateMachine.transition(job, JobStateMachine.STATES.CLAIMED);

        this.activeTenantSlotCounts.set(selectedTenantId, currentActive + 1);
        await queue.updateJob(job);
        return job;
      }
      return null;
    }

    // In-Memory Fallback Implementation
    if (!queue.tenantRings || !queue.tenantRings.has(priority)) return null;
    const ring = queue.tenantRings.get(priority);
    if (!ring || ring.length === 0) return null;

    const isContended = ring.length >= 2;

    for (let i = 0; i < ring.length; i++) {
      const selectedTenantId = ring.shift();
      ring.push(selectedTenantId); // Rotate ring

      const tenantKey = `${selectedTenantId}:${priority}`;
      const tenantList = queue.tenantQueues.get(tenantKey);

      if (!tenantList || tenantList.length === 0) {
        // Remove empty tenant from ring
        const idx = ring.indexOf(selectedTenantId);
        if (idx !== -1) ring.splice(idx, 1);
        continue;
      }

      const currentActive = this.activeTenantSlotCounts.get(selectedTenantId) || 0;
      if (isContended && currentActive >= tenantMaxSlots) {
        continue;
      }

      const job = tenantList.shift();

      // AUTHORITATIVE LEASE ISSUANCE VIA PHASE 12 WorkerLeaseManager
      ExecutionStageProfiler.startStage(job, ExecutionStageProfiler.STAGES.WORKER_LEASE_ACQUISITION);
      WorkerLeaseManager.issueLease(job, workerId);
      ExecutionStageProfiler.endStage(job, ExecutionStageProfiler.STAGES.WORKER_LEASE_ACQUISITION);
      JobStateMachine.transition(job, JobStateMachine.STATES.CLAIMED);

      this.activeTenantSlotCounts.set(selectedTenantId, currentActive + 1);
      await queue.updateJob(job);
      return job;
    }

    return null;
  }

  releaseTenantSlot(tenantId) {
    if (!tenantId) return;
    const current = this.activeTenantSlotCounts.get(tenantId) || 0;
    if (current > 0) {
      this.activeTenantSlotCounts.set(tenantId, current - 1);
    }
  }
}
