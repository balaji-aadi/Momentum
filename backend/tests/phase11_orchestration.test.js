import assert from 'assert';
import { CoreJudgeExecutor } from '../services/judge/executor/CoreJudgeExecutor.js';
import { ExecutionJob } from '../services/judge/orchestration/ExecutionJob.js';
import { JobStateMachine } from '../services/judge/orchestration/JobStateMachine.js';
import { IdempotencyGuard } from '../services/judge/orchestration/IdempotencyGuard.js';
import { RetryEngine } from '../services/judge/orchestration/RetryEngine.js';
import { MemoryExecutionQueue } from '../services/judge/orchestration/queues/MemoryExecutionQueue.js';
import { JudgeWorker } from '../services/judge/orchestration/JudgeWorker.js';
import { JudgeGatewayService } from '../services/judge/orchestration/JudgeGatewayService.js';

console.log("===============================================================================");
console.log("  PHASE 11: EXECUTION ORCHESTRATION & GATEWAY AUTOMATED TEST SUITE");
console.log("===============================================================================");

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
    // TEST SECTION 1: CoreJudgeExecutor (Transport-Independent Execution)
    // -------------------------------------------------------------------------
    console.log("\n[1. CoreJudgeExecutor - Pure Pipeline Execution]");

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

    const runRes = await CoreJudgeExecutor.execute({
      language: 'python',
      code: validCode,
      functionDefinition: funcDef,
      executionProfile: execProfile,
      testCases,
      executionLimits: { timeLimitMs: 2000, memoryLimitMb: 256 },
      isSubmit: false
    });

    assertTest("CoreJudgeExecutor: Valid code returns success: true", runRes.success === true);
    assertTest("CoreJudgeExecutor: Status is 'PASSED'", runRes.status === 'PASSED');
    assertTest("CoreJudgeExecutor: All testcases passed", runRes.passedTestCases === 2);

    // Test Wrong Answer
    const wrongCode = `
class Solution:
    def twoSum(self, nums, target):
        return [99, 99]
`;

    const wrongRes = await CoreJudgeExecutor.execute({
      language: 'python',
      code: wrongCode,
      functionDefinition: funcDef,
      executionProfile: execProfile,
      testCases,
      isSubmit: false
    });

    assertTest("CoreJudgeExecutor: Wrong answer returns status 'WRONG_ANSWER'", wrongRes.status === 'WRONG_ANSWER');
    assertTest("CoreJudgeExecutor: passedTestCases is 0", wrongRes.passedTestCases === 0);

    // -------------------------------------------------------------------------
    // TEST SECTION 2: ExecutionJob & JobStateMachine
    // -------------------------------------------------------------------------
    console.log("\n[2. ExecutionJob & JobStateMachine]");

    const job = new ExecutionJob({
      userId: 'user_123',
      problemId: 'prob_456',
      language: 'python',
      code: validCode,
      executionType: 'RUN'
    });

    assertTest("ExecutionJob: Instantiates with unique jobId", typeof job.jobId === 'string' && job.jobId.startsWith('job_'));
    assertTest("ExecutionJob: Initial state is 'CREATED'", job.state === 'CREATED');

    JobStateMachine.transition(job, JobStateMachine.STATES.QUEUED);
    assertTest("JobStateMachine: Valid transition CREATED -> QUEUED", job.state === 'QUEUED');

    JobStateMachine.transition(job, JobStateMachine.STATES.CLAIMED);
    assertTest("JobStateMachine: Valid transition QUEUED -> CLAIMED", job.state === 'CLAIMED');

    JobStateMachine.transition(job, JobStateMachine.STATES.RUNNING);
    assertTest("JobStateMachine: Valid transition CLAIMED -> RUNNING", job.state === 'RUNNING');

    JobStateMachine.transition(job, JobStateMachine.STATES.COMPLETED);
    assertTest("JobStateMachine: Valid transition RUNNING -> COMPLETED", job.state === 'COMPLETED');
    assertTest("JobStateMachine: Sets completedAt timestamp on terminal transition", typeof job.completedAt === 'string');

    let transitionErrorThrown = false;
    try {
      JobStateMachine.transition(job, JobStateMachine.STATES.RUNNING);
    } catch (e) {
      transitionErrorThrown = true;
    }
    assertTest("JobStateMachine: Throws error on invalid transition from COMPLETED -> RUNNING", transitionErrorThrown);

    // -------------------------------------------------------------------------
    // TEST SECTION 3: IdempotencyGuard
    // -------------------------------------------------------------------------
    console.log("\n[3. IdempotencyGuard]");

    const guard = new IdempotencyGuard();
    const key1 = IdempotencyGuard.computeKey({
      clientKey: 'custom-key-001',
      userId: 'user1',
      problemId: 'p1',
      language: 'python',
      code: 'print(1)'
    });

    assertTest("IdempotencyGuard: Generates client header key", key1 === 'idem_client_custom-key-001');

    await guard.register(key1, job, 60);
    const cached = await guard.check(key1);
    assertTest("IdempotencyGuard: Returns registered job from cache", cached !== null && cached.jobId === job.jobId);

    const key2 = IdempotencyGuard.computeKey({
      userId: 'user1',
      problemId: 'p1',
      language: 'python',
      code: 'print(1)',
      executionType: 'RUN',
      windowSeconds: 5
    });

    assertTest("IdempotencyGuard: Computes double-click sliding window hash key", key2.startsWith('idem_window_RUN_'));

    // -------------------------------------------------------------------------
    // TEST SECTION 4: RetryEngine Policy
    // -------------------------------------------------------------------------
    console.log("\n[4. RetryEngine Policy]");

    const userRetryEval = RetryEngine.evaluate({ status: 'WRONG_ANSWER', currentAttempt: 1 });
    assertTest("RetryEngine: Non-retryable user verdict 'WRONG_ANSWER' returns isRetryable: false", userRetryEval.isRetryable === false);

    const infraRetryEval = RetryEngine.evaluate({ status: 'WORKER_CRASH', currentAttempt: 1, maxAttempts: 3 });
    assertTest("RetryEngine: Infrastructure failure 'WORKER_CRASH' returns isRetryable: true", infraRetryEval.isRetryable === true);
    assertTest("RetryEngine: Schedules attempt 2 with exponential backoff delay", infraRetryEval.nextAttempt === 2 && infraRetryEval.delayMs === 500);

    const maxRetryEval = RetryEngine.evaluate({ status: 'WORKER_CRASH', currentAttempt: 3, maxAttempts: 3 });
    assertTest("RetryEngine: Reaching max attempts returns isRetryable: false", maxRetryEval.isRetryable === false);

    // -------------------------------------------------------------------------
    // TEST SECTION 5: MemoryExecutionQueue & Priority Queueing
    // -------------------------------------------------------------------------
    console.log("\n[5. MemoryExecutionQueue & Priority Queueing]");

    const queue = new MemoryExecutionQueue();
    const runJob = new ExecutionJob({ jobId: 'job_run_1', executionType: 'RUN', priority: 'NORMAL' });
    const submitJob = new ExecutionJob({ jobId: 'job_submit_1', executionType: 'SUBMIT', priority: 'HIGH' });

    // Enqueue RUN first, then SUBMIT
    await queue.enqueue(runJob);
    await queue.enqueue(submitJob);

    const metricsBefore = await queue.getMetrics();
    assertTest("MemoryExecutionQueue: Queued metric is 2", metricsBefore.queued === 2);

    // Dequeue should yield HIGH priority SUBMIT job first
    const dequeued1 = await queue.dequeue('worker_1');
    assertTest("MemoryExecutionQueue: Dequeues HIGH priority SUBMIT job first", dequeued1.jobId === 'job_submit_1');

    const dequeued2 = await queue.dequeue('worker_1');
    assertTest("MemoryExecutionQueue: Dequeues NORMAL priority RUN job second", dequeued2.jobId === 'job_run_1');

    // -------------------------------------------------------------------------
    // TEST SECTION 6: JudgeGatewayService & JudgeWorker End-to-End Pipeline
    // -------------------------------------------------------------------------
    console.log("\n[6. JudgeGatewayService & JudgeWorker End-to-End Pipeline]");

    const asyncQueue = new MemoryExecutionQueue();
    const gateway = new JudgeGatewayService({ queue: asyncQueue });
    const worker = new JudgeWorker({ queue: asyncQueue, pollIntervalMs: 20 });

    worker.start();

    // Gateway accepts RUN request
    const gatewayAck = await gateway.submitJob({
      language: 'python',
      code: validCode,
      functionDefinition: funcDef,
      executionProfile: execProfile,
      customTestCases: testCases,
      executionType: 'RUN',
      clientKey: 'evt-test-100'
    });

    assertTest("JudgeGatewayService: Returns success: true", gatewayAck.success === true);
    assertTest("JudgeGatewayService: Returns state: 'QUEUED'", gatewayAck.state === 'QUEUED');
    assertTest("JudgeGatewayService: Returns valid jobId", typeof gatewayAck.jobId === 'string');

    // Test Duplicate Client Key Hit
    const duplicateAck = await gateway.submitJob({
      language: 'python',
      code: validCode,
      clientKey: 'evt-test-100'
    });

    assertTest("JudgeGatewayService: Intercepts duplicate client key and returns isDuplicate: true", duplicateAck.isDuplicate === true);
    assertTest("JudgeGatewayService: Returns identical jobId for duplicate", duplicateAck.jobId === gatewayAck.jobId);

    // Wait for background worker to process job
    let finalJobState = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 100));
      finalJobState = await gateway.getJobStatus(gatewayAck.jobId);
      if (finalJobState && finalJobState.state === 'COMPLETED') {
        break;
      }
    }

    worker.stop();

    assertTest("JudgeWorker: Background worker processes job to 'COMPLETED' state", finalJobState && finalJobState.state === 'COMPLETED');
    assertTest("JudgeWorker: Result payload contains passed count of 2", finalJobState && finalJobState.result && finalJobState.result.passedTestCases === 2);

    // Test 64KB Envelope Cap Validation
    let codeSizeErrorThrown = false;
    try {
      const hugeCode = 'a'.repeat(65 * 1024);
      await gateway.submitJob({ code: hugeCode });
    } catch (e) {
      codeSizeErrorThrown = true;
    }

    assertTest("JudgeGatewayService: Rejects code payloads exceeding 64KB limit", codeSizeErrorThrown);

  } catch (err) {
    console.error("FATAL UNHANDLED TEST ERROR:", err);
    failCount++;
  } finally {
    console.log("\n===============================================================================");
    console.log(`  PHASE 11 TEST SUMMARY: ${passCount} Passed, ${failCount} Failed.`);
    console.log("===============================================================================\n");
    if (failCount > 0) process.exit(1);
  }
}

runTests();
