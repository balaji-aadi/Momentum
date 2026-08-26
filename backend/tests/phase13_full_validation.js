import assert from 'assert';
import { ExecutionJob } from '../services/judge/orchestration/ExecutionJob.js';
import { JudgeRateLimiter } from '../services/judge/orchestration/rateLimiting/JudgeRateLimiter.js';
import { BackpressureManager } from '../services/judge/orchestration/capacity/BackpressureManager.js';
import { CapacityAwareRouter } from '../services/judge/orchestration/capacity/CapacityAwareRouter.js';
import { FairShareQueueAdapter } from '../services/judge/orchestration/scheduling/FairShareQueueAdapter.js';
import { FairShareScheduler } from '../services/judge/orchestration/scheduling/FairShareScheduler.js';
import { WorkerAutoScaler } from '../services/judge/orchestration/scaling/WorkerAutoScaler.js';
import { InProcessWorkerPoolDriver } from '../services/judge/orchestration/scaling/drivers/InProcessWorkerPoolDriver.js';

console.log("===============================================================================");
console.log("  SARTHI JUDGE ENGINE: PHASE 13 FULL PRODUCTION STRESS VALIDATION SUITE");
console.log("===============================================================================\n");

let passCount = 0;
let failCount = 0;

function assertTest(name, condition, extraInfo = "") {
  if (condition) {
    console.log(`  ✓ PASS: ${name}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${name} ${extraInfo}`);
    failCount++;
  }
}

async function runFullValidation() {
  try {
    // -------------------------------------------------------------------------
    // 1. 500+ MULTI-TENANT CONCURRENT LOAD & CAPACITY STRESS TEST
    // -------------------------------------------------------------------------
    console.log("[1. 500+ Multi-Tenant Concurrent Load & Capacity Stress Test]");

    const queue = new FairShareQueueAdapter();
    const rateLimiter = new JudgeRateLimiter();
    const backpressure = new BackpressureManager({ queue, config: { maxQueue: 1000, maxWaitSloMs: 10000 } });
    const poolDriver = new InProcessWorkerPoolDriver({ queue, workerConfig: { maxConcurrency: 5 } });

    // Initial pool of 2 workers (10 execution slots total)
    await poolDriver.scaleTo(2);

    const autoScaler = new WorkerAutoScaler({
      workerDriver: poolDriver,
      queue,
      config: { minWorkers: 2, maxWorkers: 10 }
    });

    const totalRequests = 500;
    const numTenants = 10;
    const tenants = Array.from({ length: numTenants }, (_, i) => `tenant_${i + 1}`);

    const apiAckTimes = [];
    const queueWaitTimes = [];
    const completionTimes = [];
    const perTenantCompleted = new Map();
    tenants.forEach(t => perTenantCompleted.set(t, 0));

    let acceptedCount = 0;
    let rateLimitedCount = 0;
    let loadShedCount = 0;
    let jobsCompletedCount = 0;
    let failedJobsCount = 0;
    let maxQueueDepthObserved = 0;
    let maxWorkerCountObserved = 2;

    const claimedJobWorkerMap = new Map(); // jobId -> workerId
    let duplicateClaimCount = 0;

    // Track original worker dequeue to detect duplicate claims across workers
    const origDequeue = queue.dequeue.bind(queue);
    queue.dequeue = async (wId) => {
      const job = await origDequeue(wId);
      if (job) {
        if (claimedJobWorkerMap.has(job.jobId)) {
          duplicateClaimCount++;
        }
        claimedJobWorkerMap.set(job.jobId, wId);
      }
      return job;
    };

    const startTime = Date.now();
    const heapStart = process.memoryUsage().heapUsed;

    // Submit 500 requests across 10 tenants (mixed RUN / SUBMIT, Python / C++)
    const submitPromises = [];
    for (let i = 0; i < totalRequests; i++) {
      const tenantId = tenants[i % numTenants];
      const isSubmit = i % 2 === 0;
      const type = isSubmit ? 'SUBMIT' : 'RUN';
      const lang = i % 3 === 0 ? 'cpp' : 'python';

      const ackStart = Date.now();

      const p = (async () => {
        // 1. Rate Limit Check
        const rlRes = await rateLimiter.checkLimit({ userId: tenantId, executionType: type });
        if (!rlRes.allowed) {
          rateLimitedCount++;
          apiAckTimes.push(Date.now() - ackStart);
          return null;
        }

        // 2. Backpressure Check
        const bpRes = await backpressure.evaluateHealth();
        if (bpRes.state === 'SHED') {
          loadShedCount++;
          apiAckTimes.push(Date.now() - ackStart);
          return null;
        }

        // 3. Construct Job
        const job = new ExecutionJob({
          jobId: `stress_job_${i}`,
          userId: tenantId,
          executionType: type,
          language: lang,
          priority: isSubmit ? 'HIGH' : 'NORMAL',
          code: lang === 'cpp' ? '#include <iostream>\nint main() { return 0; }' : 'print(1)'
        });

        await queue.enqueue(job);
        acceptedCount++;
        apiAckTimes.push(Date.now() - ackStart);
        return job.jobId;
      })();

      submitPromises.push(p);
    }

    const createdJobIds = (await Promise.all(submitPromises)).filter(Boolean);

    // Wait loop with active auto-scaler evaluations (up to 20 seconds total)
    for (let cycle = 0; cycle < 1000; cycle++) {
      await new Promise(r => setTimeout(r, 20));

      const metrics = await queue.getMetrics();
      maxQueueDepthObserved = Math.max(maxQueueDepthObserved, metrics.queued);

      const activeWorkers = await poolDriver.getActiveWorkerCount();
      maxWorkerCountObserved = Math.max(maxWorkerCountObserved, activeWorkers);

      // Trigger auto-scaler evaluation every 10 cycles (200ms)
      if (cycle % 10 === 0) {
        await autoScaler.evaluateScalingCycle();
      }

      if (metrics.queued === 0 && metrics.active === 0) break;
    }

    const durationTotalMs = Date.now() - startTime;
    const heapEnd = process.memoryUsage().heapUsed;

    // Evaluate completed jobs
    for (const jobId of createdJobIds) {
      const job = await queue.getJob(jobId);
      if (job && job.state === 'COMPLETED') {
        jobsCompletedCount++;
        if (job.userId && perTenantCompleted.has(job.userId)) {
          perTenantCompleted.set(job.userId, perTenantCompleted.get(job.userId) + 1);
        }
        if (job.createdAt && job.startedAt) {
          queueWaitTimes.push(new Date(job.startedAt).getTime() - new Date(job.createdAt).getTime());
        }
        if (job.createdAt && job.completedAt) {
          completionTimes.push(new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime());
        }
      } else {
        failedJobsCount++;
      }
    }

    // Cleanup worker pool
    await poolDriver.scaleTo(0);

    // Calculate Percentiles
    apiAckTimes.sort((a, b) => a - b);
    queueWaitTimes.sort((a, b) => a - b);
    completionTimes.sort((a, b) => a - b);

    const p50Ack = apiAckTimes[Math.floor(apiAckTimes.length * 0.50)] || 0;
    const p95Ack = apiAckTimes[Math.floor(apiAckTimes.length * 0.95)] || 0;
    const p99Ack = apiAckTimes[Math.floor(apiAckTimes.length * 0.99)] || 0;

    const p50Wait = queueWaitTimes[Math.floor(queueWaitTimes.length * 0.50)] || 0;
    const p95Wait = queueWaitTimes[Math.floor(queueWaitTimes.length * 0.95)] || 0;
    const p99Wait = queueWaitTimes[Math.floor(queueWaitTimes.length * 0.99)] || 0;

    const p50Complete = completionTimes[Math.floor(completionTimes.length * 0.50)] || 0;
    const p95Complete = completionTimes[Math.floor(completionTimes.length * 0.95)] || 0;
    const p99Complete = completionTimes[Math.floor(completionTimes.length * 0.99)] || 0;

    console.log(`\n  --- PHASE 13 PRODUCTION STRESS VALIDATION RESULTS ---`);
    console.log(`  Total Workload Requests:    ${totalRequests}`);
    console.log(`  Requests Accepted:          ${acceptedCount}`);
    console.log(`  Rate Limited (HTTP 429):    ${rateLimitedCount}`);
    console.log(`  Load Shedding (HTTP 503):   ${loadShedCount}`);
    console.log(`  Jobs Completed:             ${jobsCompletedCount}`);
    console.log(`  Failed / Lost Jobs:         ${failedJobsCount}`);
    console.log(`  Duplicate Job Claims:       ${duplicateClaimCount}`);
    console.log(`  Max Queue Depth Observed:   ${maxQueueDepthObserved}`);
    console.log(`  Peak Worker Count:          ${maxWorkerCountObserved} workers (${maxWorkerCountObserved * 5} total slots)`);
    console.log(`  API Ack Latency p50/p95/p99: ${p50Ack} ms / ${p95Ack} ms / ${p99Ack} ms`);
    console.log(`  Queue Wait Time p50/p95/p99: ${p50Wait} ms / ${p95Wait} ms / ${p99Wait} ms`);
    console.log(`  Complete Time p50/p95/p99:   ${p50Complete} ms / ${p95Complete} ms / ${p99Complete} ms`);
    console.log(`  Heap Memory Growth:         ${((heapEnd - heapStart) / (1024 * 1024)).toFixed(2)} MB`);

    console.log(`\n  --- PER-TENANT EXECUTION DISTRIBUTION ---`);
    for (const [tenant, count] of perTenantCompleted.entries()) {
      console.log(`  ${tenant}: ${count} jobs completed`);
    }

    // Validation Assertions
    assertTest("Stress Test: API Gateway Ack p95 < 20ms", p95Ack < 20);
    assertTest("Stress Test: Zero duplicate job claims across workers", duplicateClaimCount === 0);
    assertTest("Stress Test: Zero failed or lost jobs", failedJobsCount === 0);
    assertTest("Stress Test: All accepted jobs successfully completed", jobsCompletedCount === acceptedCount);
    assertTest("Stress Test: Multi-tenant execution distributed fairly across all 10 tenants", Array.from(perTenantCompleted.values()).every(c => c > 0));
    assertTest("Stress Test: AutoScaler expanded worker pool during burst load", maxWorkerCountObserved > 2);

    process.exit(failCount > 0 ? 1 : 0);

  } catch (err) {
    console.error("FATAL STRESS VALIDATION ERROR:", err);
    process.exit(1);
  }
}

runFullValidation();
