import assert from 'assert';
import http from 'http';
import express from 'express';
import { ExecutionJob } from '../services/judge/orchestration/ExecutionJob.js';
import { JudgeRateLimiter } from '../services/judge/orchestration/rateLimiting/JudgeRateLimiter.js';
import { BackpressureManager } from '../services/judge/orchestration/capacity/BackpressureManager.js';
import { CapacityAwareRouter } from '../services/judge/orchestration/capacity/CapacityAwareRouter.js';
import { FairShareQueueAdapter } from '../services/judge/orchestration/scheduling/FairShareQueueAdapter.js';
import { FairShareScheduler } from '../services/judge/orchestration/scheduling/FairShareScheduler.js';
import { WorkerAutoScaler } from '../services/judge/orchestration/scaling/WorkerAutoScaler.js';
import { InProcessWorkerPoolDriver } from '../services/judge/orchestration/scaling/drivers/InProcessWorkerPoolDriver.js';
import judgeRouter from '../services/judge-service/judge.router.js';

console.log("===============================================================================");
console.log("  PHASE 13: HORIZONTAL SCALING & CAPACITY MANAGEMENT AUTOMATED TEST SUITE");
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

async function runTests() {
  try {
    // -------------------------------------------------------------------------
    // 1. INTEGRATION TEST 1: PRIORITY + TENANT FAIRNESS RECONCILIATION
    // -------------------------------------------------------------------------
    console.log("[1. Priority + Multi-Tenant Fairness Scheduling Integration]");
    const queue1 = new FairShareQueueAdapter();
    const scheduler1 = new FairShareScheduler({ queueAdapter: queue1 });

    // User A enqueues 5 RUN jobs (NORMAL priority)
    for (let i = 0; i < 5; i++) {
      await queue1.enqueue(new ExecutionJob({ jobId: `job_userA_run_${i}`, userId: 'userA', executionType: 'RUN', priority: 'NORMAL' }));
    }

    // User B enqueues 1 SUBMIT job (HIGH priority)
    await queue1.enqueue(new ExecutionJob({ jobId: 'job_userB_submit_0', userId: 'userB', executionType: 'SUBMIT', priority: 'HIGH' }));

    // User C enqueues 1 RUN job (NORMAL priority)
    await queue1.enqueue(new ExecutionJob({ jobId: 'job_userC_run_0', userId: 'userC', executionType: 'RUN', priority: 'NORMAL' }));

    // Dequeue 1: Must be User B's HIGH priority SUBMIT job
    const d1 = await scheduler1.dequeueNextJob(queue1, 'worker_1', 10);
    assertTest("Priority Scheduling: 1st dequeued job is User B's HIGH priority SUBMIT job", d1 && d1.userId === 'userB' && d1.priority === 'HIGH');

    // Dequeue 2: User A's 1st RUN job (1st in NORMAL priority ring)
    const d2 = await scheduler1.dequeueNextJob(queue1, 'worker_1', 10);
    assertTest("Tenant Fairness: 2nd dequeued job is User A's 1st RUN job", d2 && d2.userId === 'userA');

    // Dequeue 3: User C's RUN job (Interleaved round-robin over User A's remaining 4 jobs)
    const d3 = await scheduler1.dequeueNextJob(queue1, 'worker_1', 10);
    assertTest("Tenant Fairness: 3rd dequeued job is User C's RUN job (interleaved before User A's 2nd job)", d3 && d3.userId === 'userC');

    // Dequeue 4: User A's 2nd RUN job
    const d4 = await scheduler1.dequeueNextJob(queue1, 'worker_1', 10);
    assertTest("Tenant Fairness: 4th dequeued job is User A's 2nd RUN job", d4 && d4.userId === 'userA');

    // -------------------------------------------------------------------------
    // 2. INTEGRATION TEST 2: INTRA-PRIORITY DETERMINISTIC RING FAIRNESS
    // -------------------------------------------------------------------------
    console.log("\n[2. Deterministic Tenant-Ring Interleaving (Same Priority)]");
    const queue2 = new FairShareQueueAdapter();
    const scheduler2 = new FairShareScheduler({ queueAdapter: queue2 });

    // User A floods 5 SUBMIT jobs (HIGH)
    for (let i = 0; i < 5; i++) {
      await queue2.enqueue(new ExecutionJob({ jobId: `job_userA_sub_${i}`, userId: 'userA', executionType: 'SUBMIT', priority: 'HIGH' }));
    }

    // User B enqueues 1 SUBMIT job (HIGH)
    await queue2.enqueue(new ExecutionJob({ jobId: 'job_userB_sub_0', userId: 'userB', executionType: 'SUBMIT', priority: 'HIGH' }));

    const order = [];
    for (let i = 0; i < 3; i++) {
      const j = await scheduler2.dequeueNextJob(queue2, 'worker_1', 10);
      if (j) order.push(j.userId);
    }

    assertTest("Deterministic Ring: 1st dequeued is User A", order[0] === 'userA');
    assertTest("Deterministic Ring: 2nd dequeued is User B (A1 -> B1 -> A2 sequence)", order[1] === 'userB');
    assertTest("Deterministic Ring: 3rd dequeued is User A", order[2] === 'userA');

    // -------------------------------------------------------------------------
    // 3. INTEGRATION TEST 3: SINGLE-TENANT NON-STARVATION (100% BURST)
    // -------------------------------------------------------------------------
    console.log("\n[3. Single-Tenant Uncontended Full Capacity Burst]");
    const queue3 = new FairShareQueueAdapter();
    const scheduler3 = new FairShareScheduler({ queueAdapter: queue3 });

    // Single User A enqueues 10 jobs
    for (let i = 0; i < 10; i++) {
      await queue3.enqueue(new ExecutionJob({ jobId: `job_solo_${i}`, userId: 'soloUser', executionType: 'SUBMIT', priority: 'HIGH' }));
    }

    let dequeuedSoloCount = 0;
    for (let i = 0; i < 10; i++) {
      const j = await scheduler3.dequeueNextJob(queue3, 'worker_1', 10);
      if (j && j.userId === 'soloUser') dequeuedSoloCount++;
    }

    assertTest("Single Tenant Burst: Solo tenant consumes 100% available worker capacity (10/10 jobs)", dequeuedSoloCount === 10);

    // -------------------------------------------------------------------------
    // 4. RATE LIMITING (SLIDING WINDOW TOKEN BUCKET & HTTP 429)
    // -------------------------------------------------------------------------
    console.log("\n[4. Tenant Rate Limiting & HTTP 429 Rejections]");
    const rateLimiter = new JudgeRateLimiter();

    // Anonymous User submits up to max limit (5 for SUBMIT anonymous)
    for (let i = 0; i < 5; i++) {
      const res = await rateLimiter.checkLimit({ userId: null, ipAddress: '10.0.0.99', executionType: 'SUBMIT' });
      assertTest(`Rate Limiter: Request ${i + 1} allowed`, res.allowed === true);
    }

    // 6th request must be rejected
    const blockedRes = await rateLimiter.checkLimit({ userId: null, ipAddress: '10.0.0.99', executionType: 'SUBMIT' });
    assertTest("Rate Limiter: 6th anonymous request rejected with allowed: false", blockedRes.allowed === false);
    assertTest("Rate Limiter: Returns positive retryAfterSeconds", blockedRes.retryAfterSeconds > 0);

    // -------------------------------------------------------------------------
    // 5. MULTI-FACTOR BACKPRESSURE & HTTP 503 LOAD SHEDDING
    // -------------------------------------------------------------------------
    console.log("\n[5. Multi-Factor Gateway Backpressure & Load Shedding]");
    const backpressure = new BackpressureManager({ config: { maxQueue: 10 } });

    const normalHealth = await backpressure.evaluateHealth({ p95QueueWaitMs: 100 });
    assertTest("Backpressure: Normal queue state evaluates to ACCEPT", normalHealth.state === 'ACCEPT');

    const overloadHealth = await backpressure.evaluateHealth({ p95QueueWaitMs: 15000 });
    assertTest("Backpressure: Excessive wait time evaluates to SHED state", overloadHealth.state === 'SHED');

    // -------------------------------------------------------------------------
    // 6. CAPACITY-AWARE ROUTER & SOFT SLOT BORROWING
    // -------------------------------------------------------------------------
    console.log("\n[6. Capacity-Aware Routing & Soft Slot Borrowing]");

    const pyClass = CapacityAwareRouter.classifyWorkload('python');
    const cppClass = CapacityAwareRouter.classifyWorkload('cpp');

    assertTest("Capacity Router: Python classified as LIGHTWEIGHT", pyClass === 'LIGHTWEIGHT');
    assertTest("Capacity Router: C++ classified as HEAVY", cppClass === 'HEAVY');

    // Heavy borrowing when Heavy wait > 5000ms and Lightweight util < 30%
    const borrowCheck = CapacityAwareRouter.canExecute({
      language: 'cpp',
      totalExecutionSlots: 10,
      activeLightweightCount: 1, // 10% utilization
      activeHeavyCount: 4,       // Soft quota full
      heavyWaitTimeMs: 6000
    });

    assertTest("Capacity Router: Heavy job dynamically borrows idle Lightweight slots", borrowCheck.allowed === true && borrowCheck.borrowed === true);

    // -------------------------------------------------------------------------
    // 7. AUTOSCALER ENGINE & INFRASTRUCTURE DRIVER
    // -------------------------------------------------------------------------
    console.log("\n[7. WorkerAutoScaler Engine & Driver Cycle]");
    const autoQueue = new FairShareQueueAdapter();
    const poolDriver = new InProcessWorkerPoolDriver({ queue: autoQueue, workerConfig: { maxConcurrency: 5 } });

    await poolDriver.scaleTo(2); // Initial minWorkers = 2
    const initialWorkers = await poolDriver.getActiveWorkerCount();
    assertTest("WorkerAutoScaler: Initial pool scaled to minWorkers = 2", initialWorkers === 2);

    const autoScaler = new WorkerAutoScaler({ workerDriver: poolDriver, queue: autoQueue, config: { minWorkers: 2, maxWorkers: 10 } });

    // Flood queue to trigger scale up
    for (let i = 0; i < 30; i++) {
      await autoQueue.enqueue(new ExecutionJob({ jobId: `auto_job_${i}`, userId: 'user_flood', executionType: 'SUBMIT' }));
    }

    const scaleUpResult = await autoScaler.evaluateScalingCycle();
    const updatedWorkerCount = await poolDriver.getActiveWorkerCount();

    assertTest("WorkerAutoScaler: Queue backlog triggers SCALE_UP action", scaleUpResult.action === 'SCALE_UP');
    assertTest("WorkerAutoScaler: Active worker pool expanded beyond minWorkers", updatedWorkerCount > 2);

    // Cleanup worker pool
    await poolDriver.scaleTo(0);

  } catch (err) {
    console.error("FATAL PHASE 13 TEST ERROR:", err);
    failCount++;
  } finally {
    console.log("\n===============================================================================");
    console.log(`  PHASE 13 TEST SUMMARY: ${passCount} Passed, ${failCount} Failed.`);
    console.log("===============================================================================\n");
    process.exit(failCount > 0 ? 1 : 0);
  }
}

runTests();
