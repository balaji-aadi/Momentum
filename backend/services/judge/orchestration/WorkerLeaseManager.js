import crypto from 'crypto';
import { JobStateMachine } from './JobStateMachine.js';
import { RetryEngine } from './RetryEngine.js';

/**
 * WorkerLeaseManager - Cryptographic Fenced Job Lease Ownership Manager
 * (Phase 12 Reliability & Lease Management)
 * 
 * Manages fenced job leases (`leaseId` UUIDv4 fencing tokens, `leaseExpiresAt` TTLs),
 * periodic lease renewal, and background reclaim of expired worker leases to prevent
 * duplicate job execution during worker crashes, stalls, or network partitions.
 */
export class WorkerLeaseManager {
  static DEFAULT_LEASE_TTL_MS = 30000; // 30 second default lease

  /**
   * Issues a fenced job lease ownership token to a worker claiming a job.
   * 
   * @param {Object} job ExecutionJob instance
   * @param {string} workerId Unique worker identifier
   * @param {number} [ttlMs=30000] Lease duration in milliseconds
   * @returns {Object} Updated job with active lease
   */
  static issueLease(job, workerId, ttlMs = WorkerLeaseManager.DEFAULT_LEASE_TTL_MS) {
    if (!job) throw new Error("WorkerLeaseManager.issueLease: Valid ExecutionJob required.");

    const now = Date.now();
    const leaseId = `lease_${crypto.randomUUID()}`;
    const leaseExpiresAt = new Date(now + ttlMs).toISOString();

    job.leaseId = leaseId;
    job.leaseExpiresAt = leaseExpiresAt;
    job.workerId = workerId;
    job.leaseRenewedAt = new Date(now).toISOString();

    return {
      leaseId,
      leaseExpiresAt,
      workerId
    };
  }

  /**
   * Extends the lease duration for an actively executing job.
   * 
   * @param {Object} job ExecutionJob instance
   * @param {number} [extensionMs=15000] Additional TTL in milliseconds
   * @returns {boolean} True if lease was successfully renewed
   */
  static renewLease(job, extensionMs = 15000) {
    if (!job || !job.leaseId || !job.leaseExpiresAt) return false;

    const now = Date.now();
    const currentExpiry = new Date(job.leaseExpiresAt).getTime();

    // Do not renew if lease is already past hard expiration
    if (now > currentExpiry) return false;

    job.leaseExpiresAt = new Date(now + extensionMs).toISOString();
    job.leaseRenewedAt = new Date(now).toISOString();
    return true;
  }

  /**
   * Verifies whether a submitted fencing token (leaseId) matches the active job lease.
   * 
   * @param {Object} currentJob Active job instance in queue
   * @param {string} submittedLeaseId Fencing token submitted by worker
   * @returns {boolean} True if lease token is valid and unexpired
   */
  static verifyLease(currentJob, submittedLeaseId) {
    if (!currentJob || !currentJob.leaseId || !submittedLeaseId) return false;
    if (currentJob.leaseId !== submittedLeaseId) return false;

    const now = Date.now();
    const expiry = new Date(currentJob.leaseExpiresAt).getTime();
    return now <= expiry;
  }

  /**
   * Scans an execution queue for jobs with expired leases and reclaims them safely.
   * 
   * @param {Object} queue IExecutionQueue instance
   * @returns {Promise<Array>} List of reclaimed job IDs
   */
  static async reclaimExpiredJobs(queue) {
    if (!queue || typeof queue.getMetrics !== 'function') return [];

    const reclaimedIds = [];
    const now = Date.now();

    // Check all active jobs in queue
    const activeMap = queue.activeJobs;
    if (!activeMap || !(activeMap instanceof Map)) return [];

    for (const [jobId, record] of activeMap.entries()) {
      const job = record.job || record;
      if (!job || !job.leaseExpiresAt) continue;

      const expiry = new Date(job.leaseExpiresAt).getTime();
      if (now > expiry && !JobStateMachine.isTerminal(job.state)) {
        const retryEval = RetryEngine.evaluate({
          status: 'WORKER_CRASH',
          currentAttempt: job.attemptCount || 1,
          maxAttempts: job.maxAttempts || 3
        });

        if (retryEval.isRetryable) {
          JobStateMachine.transition(job, JobStateMachine.STATES.RETRYING, { error: 'Fenced lease expired: Worker heartbeat lost' });
          job.leaseId = null;
          job.leaseExpiresAt = null;
          await queue.enqueue(job);
        } else {
          JobStateMachine.transition(job, JobStateMachine.STATES.FAILED, { error: 'Fenced lease expired: Maximum retry attempts exceeded' });
          await queue.updateJob(job);
        }
        await queue.ack(jobId);
        reclaimedIds.push(jobId);
      }
    }

    return reclaimedIds;
  }
}
