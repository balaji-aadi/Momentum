import crypto from 'crypto';

/**
 * ExecutionJob - First-class Execution Job domain model
 * (Phase 11 & Phase 12 Extended Domain Model)
 * 
 * Represents a durable execution request with immutable identity, payload,
 * lifecycle state tracking, fenced lease ownership token, idempotency key,
 * correlation tracing, and execution result.
 */
export class ExecutionJob {
  constructor({
    jobId = null,
    userId = null,
    problemId = null,
    packageVersion = '1.0.0',
    packageHash = '',
    submissionId = null,
    executionType = 'RUN', // 'RUN' | 'SUBMIT'
    language = 'javascript',
    code = '',
    testCases = [],
    executionProfile = {},
    functionDefinition = {},
    executionLimits = {},
    priority = 'NORMAL', // 'HIGH' | 'NORMAL'
    state = 'CREATED',
    idempotencyKey = '',
    attemptCount = 0,
    maxAttempts = 3,
    error = null,
    result = null,
    createdAt = null,
    startedAt = null,
    completedAt = null,
    // Phase 12 Reliability & Tracing Additions
    leaseId = null,
    leaseExpiresAt = null,
    workerId = null,
    correlationId = null,
    traceId = null
  } = {}) {
    this.jobId = jobId || `job_${crypto.randomUUID()}`;
    this.userId = userId ? String(userId) : null;
    this.problemId = problemId ? String(problemId) : null;
    this.packageVersion = packageVersion;
    this.packageHash = packageHash;
    this.submissionId = submissionId ? String(submissionId) : null;
    this.executionType = (executionType || 'RUN').toUpperCase();
    this.language = (language || 'javascript').toLowerCase();
    this.code = code || '';
    this.testCases = testCases;
    this.executionProfile = executionProfile;
    this.functionDefinition = functionDefinition;
    this.executionLimits = executionLimits;
    this.priority = priority;
    this.state = state;
    this.idempotencyKey = idempotencyKey;
    this.attemptCount = attemptCount;
    this.maxAttempts = maxAttempts;
    this.error = error;
    this.result = result;
    this.createdAt = createdAt || new Date().toISOString();
    this.startedAt = startedAt;
    this.completedAt = completedAt;
    // Phase 12 Fields
    this.leaseId = leaseId;
    this.leaseExpiresAt = leaseExpiresAt;
    this.workerId = workerId;
    this.correlationId = correlationId || `corr_${crypto.randomUUID().slice(0, 8)}`;
    this.traceId = traceId || `trace_${crypto.randomUUID().slice(0, 8)}`;
  }

  toJSON() {
    return {
      jobId: this.jobId,
      userId: this.userId,
      problemId: this.problemId,
      packageVersion: this.packageVersion,
      packageHash: this.packageHash,
      submissionId: this.submissionId,
      executionType: this.executionType,
      language: this.language,
      code: this.code,
      testCases: this.testCases,
      executionProfile: this.executionProfile,
      functionDefinition: this.functionDefinition,
      executionLimits: this.executionLimits,
      priority: this.priority,
      state: this.state,
      idempotencyKey: this.idempotencyKey,
      attemptCount: this.attemptCount,
      maxAttempts: this.maxAttempts,
      error: this.error,
      result: this.result,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      leaseId: this.leaseId,
      leaseExpiresAt: this.leaseExpiresAt,
      workerId: this.workerId,
      correlationId: this.correlationId,
      traceId: this.traceId
    };
  }

  static fromJSON(json) {
    if (!json) return null;
    return new ExecutionJob(json);
  }
}
