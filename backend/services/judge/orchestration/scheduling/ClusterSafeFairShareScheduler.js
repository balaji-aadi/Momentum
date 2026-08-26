import { ExecutionJob } from '../ExecutionJob.js';
import { JobStateMachine } from '../JobStateMachine.js';
import { WorkerLeaseManager } from '../WorkerLeaseManager.js';
import { ExecutionStageProfiler } from '../../observability/ExecutionStageProfiler.js';

/**
 * ClusterSafeFairShareScheduler - Redis Cluster-Safe Multi-Tenant Deterministic Priority Scheduler
 * (Phase 15 Cluster Infrastructure Module - Stage 15.1)
 * 
 * Preserves 100% of Phase 13 scheduling semantics (Priority Class -> Interleaved Tenant Round-Robin -> FIFO Queue Age).
 * Decouples multi-key operations via a dual-step pipeline to guarantee Redis Cluster CROSSSLOT safety.
 * Immediately delegates lease issuance to Phase 12 WorkerLeaseManager upon atomic job pop.
 */
export class ClusterSafeFairShareScheduler {
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

    // Redis Cluster-Safe Dual-Step Dequeue Pipeline
    if (this.redis && this.redis.status === 'ready') {
      const ringKey = `sarthi:tenant_ring:${priority}`;
      const ringLength = await this.redis.llen(ringKey);

      if (ringLength === 0) return null;

      const isContended = ringLength >= 2;

      for (let i = 0; i < ringLength; i++) {
        // Step 1: Atomic single-key ring cursor rotation (Cluster Safe)
        const selectedTenantId = await this.redis.rpoplpush(ringKey, ringKey);
        if (!selectedTenantId) continue;

        const currentActive = this.activeTenantSlotCounts.get(selectedTenantId) || 0;
        if (isContended && currentActive >= tenantMaxSlots) {
          continue; // Skip tenant if cap reached during multi-tenant contention
        }

        // Step 2: Single-key queue LPOP with Hash Tag {selectedTenantId} (Cluster Safe)
        const queueKey = `sarthi:queue:{${selectedTenantId}}:${priority}`;
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

    // In-Memory Fallback Implementation (Preserves 100% Phase 13 Scheduling Semantics)
    if (!queue.tenantRings || !queue.tenantRings.has(priority)) return null;
    const ring = queue.tenantRings.get(priority);
    if (!ring || ring.length === 0) return null;

    const isContended = ring.length >= 2;

    for (let i = 0; i < ring.length; i++) {
      const selectedTenantId = ring.shift();
      ring.push(selectedTenantId); // Deterministic round-robin interleave

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
