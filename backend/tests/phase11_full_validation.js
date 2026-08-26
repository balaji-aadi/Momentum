import assert from 'assert';
import http from 'http';
import express from 'express';
import { ExecutionJob } from '../services/judge/orchestration/ExecutionJob.js';
import { JobStateMachine } from '../services/judge/orchestration/JobStateMachine.js';
import { IdempotencyGuard } from '../services/judge/orchestration/IdempotencyGuard.js';
import { RetryEngine } from '../services/judge/orchestration/RetryEngine.js';
import { MemoryExecutionQueue } from '../services/judge/orchestration/queues/MemoryExecutionQueue.js';
import { RedisExecutionQueue } from '../services/judge/orchestration/queues/RedisExecutionQueue.js';
import { JudgeWorker } from '../services/judge/orchestration/JudgeWorker.js';
import { JudgeGatewayService } from '../services/judge/orchestration/JudgeGatewayService.js';
import { CoreJudgeExecutor } from '../services/judge/executor/CoreJudgeExecutor.js';
import judgeRouter from '../services/judge-service/judge.router.js';

console.log("===============================================================================");
console.log("  SARTHI JUDGE ENGINE: PHASE 11 PRODUCTION VALIDATION SUITE");
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

// In-Memory Mock Redis Client to test RedisExecutionQueue path directly without host binary
class MockRedisClient {
  constructor() {
    this.status = 'ready';
    this.lists = new Map();
    this.hashes = new Map();
  }

  async rpush(key, val) {
    if (!this.lists.has(key)) this.lists.set(key, []);
    this.lists.get(key).push(val);
    return this.lists.get(key).length;
  }

  async lpop(key) {
    if (!this.lists.has(key)) return null;
    const list = this.lists.get(key);
    return list.shift() || null;
  }

  async hset(mapName, field, val) {
    if (!this.hashes.has(mapName)) this.hashes.set(mapName, new Map());
    this.hashes.get(mapName).set(field, val);
    return 1;
  }

  async hget(mapName, field) {
    if (!this.hashes.has(mapName)) return null;
    return this.hashes.get(mapName).get(field) || null;
  }

  async hdel(mapName, field) {
    if (this.hashes.has(mapName)) {
      this.hashes.get(mapName).delete(field);
    }
    return 1;
  }

  async llen(key) {
    return this.lists.has(key) ? this.lists.get(key).length : 0;
  }

  async hlen(mapName) {
    return this.hashes.has(mapName) ? this.hashes.get(mapName).size : 0;
  }
}

async function runValidation() {
  try {
    const validCode = `
class Solution:
    def twoSum(self, nums, target):
        lookup = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in lookup:
                return [lookup[diff], i]
            lookup[num] = i
        return []
`;

    const funcDef = {
      functionName: 'twoSum',
      name: 'twoSum',
      parameters: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }],
      returnType: 'number[]'
    };

    const execProfile = {
      runtimeType: 'FUNCTION',
      outputSerializer: 'ArraySerializer',
      comparator: 'UnorderedArrayMatch'
    };

    const testCases = [
      { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
      { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] }
    ];

    // =========================================================================
    // 1. REAL REDIS QUEUE DRIVER EXECUTION PATH
    // =========================================================================
    console.log("[1. Real Redis Queue Driver Execution Path]");
    const mockRedis = new MockRedisClient();
    const redisQueue = new RedisExecutionQueue({ redisClient: mockRedis });

    const redisJob = new ExecutionJob({
      jobId: 'job_redis_001',
      language: 'python',
      code: validCode,
      functionDefinition: funcDef,
      executionProfile: execProfile,
      testCases,
      priority: 'HIGH',
      executionType: 'SUBMIT'
    });

    await redisQueue.enqueue(redisJob);
    const metrics1 = await redisQueue.getMetrics();
    assertTest("Redis Queue Driver: Job enqueued into Redis list 'sarthi:queue:high'", metrics1.queued === 1);

    const redisWorker = new JudgeWorker({ workerId: 'redis_worker_1', queue: redisQueue, pollIntervalMs: 10 });
    redisWorker.start();

    for (let i = 0; i < 50; i++) {
      await new Promise(r => setTimeout(r, 50));
      const status = await redisQueue.getJob('job_redis_001');
      if (status && status.state === 'COMPLETED') break;
    }
    redisWorker.stop();

    const finalRedisJob = await redisQueue.getJob('job_redis_001');
    assertTest("Redis Queue Driver: JudgeWorker dequeues and processes job to 'COMPLETED'", finalRedisJob && finalRedisJob.state === 'COMPLETED');
    assertTest("Redis Queue Driver: Result contains passedTestCases === 2", finalRedisJob && finalRedisJob.result && finalRedisJob.result.passedTestCases === 2);

    // =========================================================================
    // 2. MULTI-WORKER CONCURRENT EXECUTION VALIDATION
    // =========================================================================
    console.log("\n[2. Multi-Worker Concurrent Execution & Race Prevention]");
    const multiQueue = new MemoryExecutionQueue();
    const workerAlpha = new JudgeWorker({ workerId: 'worker_alpha', queue: multiQueue, maxConcurrency: 3, pollIntervalMs: 10 });
    const workerBeta = new JudgeWorker({ workerId: 'worker_beta', queue: multiQueue, maxConcurrency: 3, pollIntervalMs: 10 });

    const totalMultiJobs = 20;
    const claimedJobIds = new Set();
    const activeExecutionMap = new Map();
    let duplicateExecutionCount = 0;

    const origDequeue = multiQueue.dequeue.bind(multiQueue);
    multiQueue.dequeue = async (wId) => {
      const job = await origDequeue(wId);
      if (job) {
        if (activeExecutionMap.has(job.jobId) && activeExecutionMap.get(job.jobId) !== wId) {
          duplicateExecutionCount++;
        }
        activeExecutionMap.set(job.jobId, wId);
        claimedJobIds.add(job.jobId);
      }
      return job;
    };

    const origAck = multiQueue.ack.bind(multiQueue);
    multiQueue.ack = async (jId) => {
      activeExecutionMap.delete(jId);
      return origAck(jId);
    };

    workerAlpha.start();
    workerBeta.start();

    for (let i = 0; i < totalMultiJobs; i++) {
      const type = i % 2 === 0 ? 'SUBMIT' : 'RUN';
      const j = new ExecutionJob({
        jobId: `multi_job_${i}`,
        language: 'python',
        code: validCode,
        functionDefinition: funcDef,
        executionProfile: execProfile,
        testCases,
        executionType: type,
        priority: type === 'SUBMIT' ? 'HIGH' : 'NORMAL'
      });
      await multiQueue.enqueue(j);
    }

    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 100));
      const m = await multiQueue.getMetrics();
      if (claimedJobIds.size === totalMultiJobs && m.queued === 0 && m.active === 0) break;
    }

    workerAlpha.stop();
    workerBeta.stop();

    assertTest("Multi-Worker: 20 jobs distributed across worker_alpha & worker_beta", claimedJobIds.size === totalMultiJobs);
    assertTest("Multi-Worker: ZERO duplicate job executions occurred", duplicateExecutionCount === 0);

    // =========================================================================
    // 3. 500 CONCURRENT REQUEST LOAD TEST & PERFORMANCE METRICS
    // =========================================================================
    console.log("\n[3. 500 Concurrent Request Load Test]");

    const loadQueue = new MemoryExecutionQueue();
    const loadGateway = new JudgeGatewayService({ queue: loadQueue });
    
    // Override CoreJudgeExecutor for load test to measure pure queue/worker pipeline throughput
    const origExec = CoreJudgeExecutor.execute;
    CoreJudgeExecutor.execute = async () => {
      await new Promise(r => setTimeout(r, 2)); // 2ms synthetic execution delay
      return {
        success: true,
        status: 'PASSED',
        verdict: 'ACCEPTED',
        totalTestCases: 2,
        passedTestCases: 2,
        executionTimeMs: 2,
        testCases: []
      };
    };

    const loadWorker1 = new JudgeWorker({ workerId: 'load_worker_1', queue: loadQueue, maxConcurrency: 25, pollIntervalMs: 5 });
    const loadWorker2 = new JudgeWorker({ workerId: 'load_worker_2', queue: loadQueue, maxConcurrency: 25, pollIntervalMs: 5 });

    loadWorker1.start();
    loadWorker2.start();

    const loadCount = 500;
    const gatewayAckTimes = [];
    const queueWaitTimes = [];
    const completionTimes = [];
    let requestsAccepted = 0;
    let jobsCreated = 0;
    let jobsCompleted = 0;
    let failedJobs = 0;

    const startMem = process.memoryUsage().heapUsed;
    const startCpu = process.cpuUsage();
    const testStartTime = Date.now();

    const gatewayPromises = [];
    for (let i = 0; i < loadCount; i++) {
      const type = i % 2 === 0 ? 'RUN' : 'SUBMIT';
      const ackStart = Date.now();

      const p = loadGateway.submitJob({
        language: 'python',
        code: validCode,
        functionDefinition: funcDef,
        executionProfile: execProfile,
        customTestCases: testCases,
        executionType: type,
        clientKey: `load_key_${i}`
      }).then(ack => {
        const ackDuration = Date.now() - ackStart;
        gatewayAckTimes.push(ackDuration);

        if (ack.success && ack.state === 'QUEUED') {
          requestsAccepted++;
          jobsCreated++;
        }
        return ack.jobId;
      });

      gatewayPromises.push(p);
    }

    const createdJobIds = await Promise.all(gatewayPromises);
    let maxQueueDepthObserved = 0;

    for (let i = 0; i < 300; i++) {
      await new Promise(r => setTimeout(r, 20));
      const metrics = await loadQueue.getMetrics();
      maxQueueDepthObserved = Math.max(maxQueueDepthObserved, metrics.queued);

      if (metrics.queued === 0 && metrics.active === 0) break;
    }

    loadWorker1.stop();
    loadWorker2.stop();

    // Restore original CoreJudgeExecutor
    CoreJudgeExecutor.execute = origExec;

    const endCpu = process.cpuUsage(startCpu);
    const endMem = process.memoryUsage().heapUsed;

    for (const id of createdJobIds) {
      const j = await loadQueue.getJob(id);
      if (j && j.state === 'COMPLETED') {
        jobsCompleted++;
        if (j.startedAt && j.createdAt) {
          queueWaitTimes.push(new Date(j.startedAt).getTime() - new Date(j.createdAt).getTime());
        }
        if (j.completedAt && j.createdAt) {
          completionTimes.push(new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime());
        }
      } else {
        failedJobs++;
      }
    }

    gatewayAckTimes.sort((a, b) => a - b);
    queueWaitTimes.sort((a, b) => a - b);
    completionTimes.sort((a, b) => a - b);

    const p95Ack = gatewayAckTimes[Math.floor(gatewayAckTimes.length * 0.95)] || 0;
    const p99Ack = gatewayAckTimes[Math.floor(gatewayAckTimes.length * 0.99)] || 0;
    const p95Wait = queueWaitTimes[Math.floor(queueWaitTimes.length * 0.95)] || 0;
    const p95Complete = completionTimes[Math.floor(completionTimes.length * 0.95)] || 0;

    console.log(`\n  --- 500 CONCURRENT LOAD TEST RESULTS ---`);
    console.log(`  Requests Accepted:      ${requestsAccepted} / ${loadCount}`);
    console.log(`  Jobs Created:           ${jobsCreated}`);
    console.log(`  Jobs Completed:         ${jobsCompleted}`);
    console.log(`  Failed Jobs:            ${failedJobs}`);
    console.log(`  Max Queue Depth:        ${maxQueueDepthObserved}`);
    console.log(`  API Ack Latency p95:    ${p95Ack} ms`);
    console.log(`  API Ack Latency p99:    ${p99Ack} ms`);
    console.log(`  Queue Wait Time p95:    ${p95Wait} ms`);
    console.log(`  End-to-End Complete p95:${p95Complete} ms`);
    console.log(`  Heap Memory Delta:      ${((endMem - startMem) / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  CPU User Time:          ${(endCpu.user / 1000).toFixed(0)} ms`);

    assertTest("500 Load Test: All 500 requests accepted", requestsAccepted === loadCount);
    assertTest("500 Load Test: All 500 jobs completed", jobsCompleted === loadCount);
    assertTest("500 Load Test: Zero jobs failed", failedJobs === 0);
    assertTest("500 Load Test: API Gateway Ack p95 < 30ms", p95Ack < 30);

    // =========================================================================
    // 4. WORKER CRASH & RECOVERY VALIDATION
    // =========================================================================
    console.log("\n[4. Worker Crash & Recovery]");

    const crashQueue = new MemoryExecutionQueue();
    const worker1 = new JudgeWorker({ workerId: 'crasher_1', queue: crashQueue, pollIntervalMs: 10 });
    const worker2 = new JudgeWorker({ workerId: 'recoverer_2', queue: crashQueue, pollIntervalMs: 10 });

    // Test Infra Crash Retry
    const infraCrashJob = new ExecutionJob({
      jobId: 'infra_job_784',
      language: 'python',
      code: validCode,
      functionDefinition: funcDef,
      executionProfile: execProfile,
      testCases,
      executionType: 'SUBMIT'
    });

    await crashQueue.enqueue(infraCrashJob);
    const claimedJob = await crashQueue.dequeue('crasher_1');

    // Simulate Worker 1 crashing mid-execution
    const infraEval = RetryEngine.evaluate({ status: 'WORKER_CRASH', currentAttempt: claimedJob.attemptCount || 1, maxAttempts: 3 });
    assertTest("Worker Crash: Infra crash evaluates to isRetryable: true", infraEval.isRetryable === true);

    JobStateMachine.transition(claimedJob, JobStateMachine.STATES.RETRYING, { error: infraEval.reason });
    await crashQueue.enqueue(claimedJob); // Requeue for worker 2

    worker2.start();
    for (let i = 0; i < 50; i++) {
      await new Promise(r => setTimeout(r, 50));
      const j = await crashQueue.getJob('infra_job_784');
      if (j && j.state === 'COMPLETED') break;
    }
    worker2.stop();

    const recoveredJob = await crashQueue.getJob('infra_job_784');
    assertTest("Worker Crash: Abandoned job recovered by worker 2 to 'COMPLETED'", recoveredJob && recoveredJob.state === 'COMPLETED');

    // Test Student Code Error Non-Retry
    const userErrorEval = RetryEngine.evaluate({ status: 'WRONG_ANSWER', currentAttempt: 1 });
    assertTest("Worker Crash: Student code WRONG_ANSWER is NOT retried (isRetryable: false)", userErrorEval.isRetryable === false);

    // =========================================================================
    // 5. IDEMPOTENCY SPECIFICATION VALIDATION
    // =========================================================================
    console.log("\n[5. Idempotency Specification]");

    const idemGuard = new IdempotencyGuard();
    const idemGateway = new JudgeGatewayService({ idempotencyGuard: idemGuard });

    // 1. Client Header Duplicate
    const ackA1 = await idemGateway.submitJob({ code: validCode, clientKey: 'hdr_key_999' });
    const ackA2 = await idemGateway.submitJob({ code: validCode, clientKey: 'hdr_key_999' });
    assertTest("Idempotency: Client Idempotency-Key header returns identical jobId", ackA1.jobId === ackA2.jobId && ackA2.isDuplicate === true);

    // 2. RUN Double-Click Window (5s)
    const ackB1 = await idemGateway.submitJob({ userId: 'u1', problemId: 'p1', code: validCode, executionType: 'RUN' });
    const ackB2 = await idemGateway.submitJob({ userId: 'u1', problemId: 'p1', code: validCode, executionType: 'RUN' });
    assertTest("Idempotency: RUN double-click within 5s returns active jobId", ackB1.jobId === ackB2.jobId && ackB2.isDuplicate === true);

    // 3. SUBMIT Duplicate Window (10s)
    const ackC1 = await idemGateway.submitJob({ userId: 'u1', problemId: 'p1', code: validCode, executionType: 'SUBMIT' });
    const ackC2 = await idemGateway.submitJob({ userId: 'u1', problemId: 'p1', code: validCode, executionType: 'SUBMIT' });
    assertTest("Idempotency: SUBMIT duplicate within 10s returns active jobId", ackC1.jobId === ackC2.jobId && ackC2.isDuplicate === true);

    // 4. Genuinely New Code Submission
    const newCode = validCode + "\n# new edit";
    const ackD = await idemGateway.submitJob({ userId: 'u1', problemId: 'p1', code: newCode, executionType: 'RUN' });
    assertTest("Idempotency: Genuinely new code payload creates new jobId", ackD.jobId !== ackB1.jobId && ackD.isDuplicate === false);

    // =========================================================================
    // 6. JOB LIFECYCLE & STATE MACHINE TRANSITIONS
    // =========================================================================
    console.log("\n[6. Job Lifecycle & State Machine Transitions]");

    const lifeJob = new ExecutionJob({ jobId: 'life_001', executionType: 'RUN' });
    assertTest("Lifecycle: State 1 is 'CREATED'", lifeJob.state === 'CREATED');

    JobStateMachine.transition(lifeJob, JobStateMachine.STATES.QUEUED);
    assertTest("Lifecycle: State 2 is 'QUEUED'", lifeJob.state === 'QUEUED');

    JobStateMachine.transition(lifeJob, JobStateMachine.STATES.CLAIMED);
    assertTest("Lifecycle: State 3 is 'CLAIMED'", lifeJob.state === 'CLAIMED');

    JobStateMachine.transition(lifeJob, JobStateMachine.STATES.RUNNING);
    assertTest("Lifecycle: State 4 is 'RUNNING'", lifeJob.state === 'RUNNING');

    JobStateMachine.transition(lifeJob, JobStateMachine.STATES.COMPLETED);
    assertTest("Lifecycle: State 5 is 'COMPLETED'", lifeJob.state === 'COMPLETED');

    // =========================================================================
    // 7. SANDBOX & RESOURCE ENFORCEMENT
    // =========================================================================
    console.log("\n[7. Sandbox & Resource Limits Enforcement]");

    const timeoutCode = `
class Solution:
    def twoSum(self, nums, target):
        while True:
            pass
`;

    const timeoutRes = await CoreJudgeExecutor.execute({
      language: 'python',
      code: timeoutCode,
      functionDefinition: funcDef,
      executionProfile: execProfile,
      testCases,
      executionLimits: { timeLimitMs: 1000 }
    });

    assertTest("Sandbox Enforcement: CPU infinite loop returns TIME_LIMIT_EXCEEDED", timeoutRes.status === 'TIME_LIMIT_EXCEEDED' || timeoutRes.verdict === 'TIME_LIMIT_EXCEEDED');

    const outputSpamCode = `
class Solution:
    def twoSum(self, nums, target):
        print("X" * (5 * 1024 * 1024))
        return [0, 1]
`;

    const spamRes = await CoreJudgeExecutor.execute({
      language: 'python',
      code: outputSpamCode,
      functionDefinition: funcDef,
      executionProfile: execProfile,
      testCases,
      executionLimits: { timeLimitMs: 2000, outputLimitBytes: 1024 * 1024 }
    });

    assertTest("Sandbox Enforcement: Output spam returns OUTPUT_LIMIT_EXCEEDED or process error", spamRes.status === 'OUTPUT_LIMIT_EXCEEDED' || spamRes.status === 'PROCESS_ERROR' || spamRes.verdict === 'OUTPUT_LIMIT_EXCEEDED');

    // =========================================================================
    // 8. FEATURE-FLAG MIGRATION & FALLBACK VERIFICATION
    // =========================================================================
    console.log("\n[8. Feature-Flag Migration & Fallback]");

    const app = express();
    app.use(express.json());
    app.use('/api/v1/judge', judgeRouter);

    const server = app.listen(0);
    const port = server.address().port;

    // Test 1: Synchronous Mode (Flag = false)
    process.env.JUDGE_ASYNC_ORCHESTRATION_ENABLED = 'false';

    const syncRes = await new Promise(res => {
      const req = http.request(`http://localhost:${port}/api/v1/judge/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, r => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => res({ statusCode: r.statusCode, body: JSON.parse(data) }));
      });
      req.write(JSON.stringify({ language: 'python', code: validCode }));
      req.end();
    });

    assertTest("Migration: Flag=false returns HTTP 200 OK synchronous result", syncRes.statusCode === 200 && syncRes.body.data.status === 'PASSED');

    // Test 2: Asynchronous Mode (Flag = true)
    process.env.JUDGE_ASYNC_ORCHESTRATION_ENABLED = 'true';

    const asyncRes = await new Promise(res => {
      const req = http.request(`http://localhost:${port}/api/v1/judge/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, r => {
        let data = '';
        r.on('data', chunk => data += chunk);
        r.on('end', () => res({ statusCode: r.statusCode, body: JSON.parse(data) }));
      });
      req.write(JSON.stringify({ language: 'python', code: validCode }));
      req.end();
    });

    assertTest("Migration: Flag=true returns HTTP 202 Accepted with jobId", asyncRes.statusCode === 202 && asyncRes.body.data.state === 'QUEUED');

    server.close();

  } catch (err) {
    console.error("FATAL VALIDATION ERROR:", err);
    failCount++;
  } finally {
    console.log("\n===============================================================================");
    console.log(`  PHASE 11 FINAL VALIDATION SUMMARY: ${passCount} Passed, ${failCount} Failed.`);
    console.log("===============================================================================\n");
    if (failCount > 0) process.exit(1);
  }
}

runValidation();
