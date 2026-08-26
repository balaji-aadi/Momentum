import { ExecutionJob } from './ExecutionJob.js';
import { defaultIdempotencyGuard } from './IdempotencyGuard.js';
import { MemoryExecutionQueue } from './queues/MemoryExecutionQueue.js';

/**
 * JudgeGatewayService - Asynchronous Execution Gateway & Job Dispatcher
 * (Phase 11 & Phase 13 Extended Gateway Service)
 * 
 * Accepts HTTP execution requests, validates payloads, enforces 64KB code limit,
 * checks IdempotencyGuard, creates ExecutionJob, enqueues to IExecutionQueue,
 * and returns immediate HTTP 202 Accepted response.
 */
export class JudgeGatewayService {
  constructor({ queue = null, idempotencyGuard = null, maxCodeSizeBytes = 64 * 1024 } = {}) {
    this.queue = queue || new MemoryExecutionQueue();
    this.idempotencyGuard = idempotencyGuard || defaultIdempotencyGuard;
    this.maxCodeSizeBytes = maxCodeSizeBytes;
  }

  /**
   * Accepts and enqueues a RUN or SUBMIT execution request.
   * 
   * @param {Object} params
   * @param {Object} [params.problem] Problem model instance / object
   * @param {string} [params.language='javascript']
   * @param {string} params.code Student source code string
   * @param {Array} [params.customTestCases] Optional custom testcases for RUN
   * @param {string|null} [params.userId] Optional submitting user ID
   * @param {string} [params.executionType='RUN'] 'RUN' | 'SUBMIT'
   * @param {string} [params.clientKey] Header 'Idempotency-Key'
   * @param {string} [params.correlationId] Header 'x-correlation-id'
   * @param {string} [params.traceId] Header 'x-trace-id'
   * @returns {Promise<Object>} Gateway acknowledgment response { success, jobId, state, statusUrl, isDuplicate }
   */
  async submitJob({
    problem,
    language = 'javascript',
    code,
    customTestCases,
    userId = null,
    executionType = 'RUN',
    clientKey = null,
    correlationId = null,
    traceId = null
  }) {
    if (!code || typeof code !== 'string' || !code.trim()) {
      throw new Error("Code parameter cannot be empty.");
    }

    if (Buffer.byteLength(code, 'utf8') > this.maxCodeSizeBytes) {
      throw new Error(`Code size exceeds maximum allowed envelope limit of ${this.maxCodeSizeBytes / 1024}KB.`);
    }

    const type = (executionType || 'RUN').toUpperCase();
    const probObj = problem && typeof problem.toObject === 'function' ? problem.toObject() : problem;
    const packageHash = probObj?.packageHash || probObj?._id || '';

    // 1. Check Idempotency Guard
    const windowSeconds = type === 'SUBMIT' ? 10 : 5;
    const idempotencyKey = defaultIdempotencyGuard.constructor.computeKey({
      clientKey,
      userId,
      problemId: probObj?._id || probObj?.slug,
      language,
      code,
      executionType: type,
      packageHash,
      windowSeconds
    });

    const cachedJob = await this.idempotencyGuard.check(idempotencyKey);
    if (cachedJob) {
      return {
        success: true,
        jobId: cachedJob.jobId,
        state: cachedJob.state,
        statusUrl: `/api/v1/judge/jobs/${cachedJob.jobId}`,
        isDuplicate: true
      };
    }

    // 2. Resolve Function Schema & Execution Profile
    const functionDefinition = probObj?.functionDefinition || {
      functionName: 'twoSum',
      name: 'twoSum',
      parameters: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }],
      returnType: 'number[]'
    };

    const executionProfile = probObj?.executionProfile || {
      runtimeType: 'FUNCTION',
      outputSerializer: 'ArraySerializer',
      comparator: 'UnorderedArrayMatch'
    };

    // 3. Resolve Testcases
    let testCases = [];
    if (type === 'RUN') {
      if (Array.isArray(customTestCases) && customTestCases.length > 0) {
        testCases = customTestCases;
      } else if (Array.isArray(probObj?.visibleTestCases) && probObj.visibleTestCases.length > 0) {
        testCases = probObj.visibleTestCases;
      } else {
        testCases = [
          { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
          { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] }
        ];
      }
    } else {
      const hiddenTCs = Array.isArray(probObj?.hiddenTestCases) && probObj.hiddenTestCases.length > 0
        ? probObj.hiddenTestCases
        : (Array.isArray(probObj?.visibleTestCases) ? probObj.visibleTestCases : []);
      testCases = hiddenTCs.length > 0 ? hiddenTCs : [
        { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
        { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] }
      ];
    }

    const executionLimits = probObj?.executionLimits || {};

    // 4. Construct ExecutionJob with Tracing Context
    const job = new ExecutionJob({
      userId,
      problemId: probObj?._id || null,
      packageVersion: probObj?.packageVersion || '1.0.0',
      packageHash,
      executionType: type,
      language,
      code,
      testCases,
      executionProfile,
      functionDefinition,
      executionLimits,
      priority: type === 'SUBMIT' ? 'HIGH' : 'NORMAL',
      idempotencyKey,
      correlationId,
      traceId
    });

    // 5. Enqueue & Register Idempotency
    await this.queue.enqueue(job);
    await this.idempotencyGuard.register(idempotencyKey, job, type === 'SUBMIT' ? 60 : 30);

    return {
      success: true,
      jobId: job.jobId,
      state: job.state,
      statusUrl: `/api/v1/judge/jobs/${job.jobId}`,
      isDuplicate: false
    };
  }

  /**
   * Fetches job state and result payload by jobId.
   * 
   * @param {string} jobId
   * @returns {Promise<Object|null>}
   */
  async getJobStatus(jobId) {
    if (!jobId) return null;
    const job = await this.queue.getJob(jobId);
    if (!job) return null;
    return typeof job.toJSON === 'function' ? job.toJSON() : job;
  }
}

export const defaultJudgeGateway = new JudgeGatewayService();
