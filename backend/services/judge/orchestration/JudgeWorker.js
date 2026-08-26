import { JobStateMachine } from './JobStateMachine.js';
import { CoreJudgeExecutor } from '../executor/CoreJudgeExecutor.js';
import { ProfilingCoreJudgeExecutor } from '../executor/ProfilingCoreJudgeExecutor.js';
import { RetryEngine } from './RetryEngine.js';

/**
 * JudgeWorker - Background Job Execution Worker
 * (Phase 11 Worker Engine)
 * 
 * Background process worker that claims jobs from IExecutionQueue, enforces worker
 * concurrency caps, invokes CoreJudgeExecutor, handles retry logic, and updates state.
 */
export class JudgeWorker {
  constructor({
    workerId = `worker_${Math.random().toString(36).substring(2, 9)}`,
    queue,
    maxConcurrency = 5,
    pollIntervalMs = 100
  }) {
    this.workerId = workerId;
    this.queue = queue;
    this.maxConcurrency = maxConcurrency;
    this.pollIntervalMs = pollIntervalMs;
    this.activeCount = 0;
    this.isRunning = false;
    this.timer = null;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNextPoll();
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  scheduleNextPoll() {
    if (!this.isRunning) return;
    this.timer = setTimeout(async () => {
      await this.pollAndExecute();
      this.scheduleNextPoll();
    }, this.pollIntervalMs);
  }

  async pollAndExecute() {
    if (this.activeCount >= this.maxConcurrency) {
      return;
    }

    try {
      const job = await this.queue.dequeue(this.workerId);
      if (!job) return;

      this.activeCount++;
      // Execute asynchronously to not block worker loop
      this.processJob(job).finally(() => {
        this.activeCount--;
      });
    } catch (err) {
      console.error(`JudgeWorker [${this.workerId}] poll error:`, err);
    }
  }

  async processJob(job) {
    try {
      JobStateMachine.transition(job, JobStateMachine.STATES.RUNNING);
      job.attemptCount = (job.attemptCount || 0) + 1;
      await this.queue.updateJob(job);

      // Invoke transport-independent ProfilingCoreJudgeExecutor decorator wrapper
      const execResult = await ProfilingCoreJudgeExecutor.execute(job, {
        language: job.language,
        code: job.code,
        functionDefinition: job.functionDefinition,
        executionProfile: job.executionProfile,
        testCases: job.testCases,
        executionLimits: job.executionLimits,
        strictSandboxMode: false,
        isSubmit: job.executionType === 'SUBMIT'
      });

      // Check for infrastructure retry vs user verdict
      const status = execResult.status || execResult.verdict || 'PROCESS_ERROR';
      const retryPolicy = RetryEngine.evaluate({
        status,
        currentAttempt: job.attemptCount,
        maxAttempts: job.maxAttempts || 3
      });

      if (retryPolicy.isRetryable) {
        JobStateMachine.transition(job, JobStateMachine.STATES.RETRYING, { error: retryPolicy.reason });
        await this.queue.updateJob(job);
        // Delay before re-enqueueing
        setTimeout(async () => {
          await this.queue.enqueue(job);
        }, retryPolicy.delayMs);
      } else {
        const isSuccess = execResult.success === true && (status === 'PASSED' || status === 'ACCEPTED');
        const finalState = isSuccess
          ? JobStateMachine.STATES.COMPLETED
          : (RetryEngine.USER_NON_RETRYABLE_VERDICTS.includes(status)
              ? JobStateMachine.STATES.COMPLETED
              : JobStateMachine.STATES.INFRA_ERROR);

        JobStateMachine.transition(job, finalState, {
          result: execResult,
          error: execResult.error || null
        });

        await this.queue.updateJob(job);
        await this.queue.ack(job.jobId);
      }
    } catch (procErr) {
      console.error(`JudgeWorker [${this.workerId}] process error on job ${job.jobId}:`, procErr);
      try {
        JobStateMachine.transition(job, JobStateMachine.STATES.FAILED, { error: procErr.message });
        await this.queue.updateJob(job);
        await this.queue.nack(job.jobId, procErr.message);
      } catch (e) {
        // Ignore state transition errors if already in terminal state
      }
    }
  }
}
