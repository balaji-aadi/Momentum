/**
 * RetryEngine - Classification & Retry Policy Evaluator
 * (Phase 11 Retry Engine)
 * 
 * Classifies execution outcomes into non-retryable user errors vs. retryable infrastructure failures.
 */
export class RetryEngine {
  static USER_NON_RETRYABLE_VERDICTS = Object.freeze([
    'ACCEPTED',
    'WRONG_ANSWER',
    'COMPILE_ERROR',
    'SYNTAX_ERROR',
    'RUNTIME_ERROR',
    'TIME_LIMIT_EXCEEDED',
    'MEMORY_LIMIT_EXCEEDED',
    'OUTPUT_LIMIT_EXCEEDED'
  ]);

  static INFRA_RETRYABLE_ERRORS = Object.freeze([
    'WORKER_CRASH',
    'SANDBOX_UNAVAILABLE',
    'PROCESS_ERROR',
    'INFRASTRUCTURE_FAILURE',
    'INTERNAL_JUDGE_ERROR'
  ]);

  /**
   * Determines if a job execution failure is retryable according to bounded retry policy.
   * 
   * @param {Object} params
   * @param {string} params.status Execution status / verdict
   * @param {number} params.currentAttempt
   * @param {number} params.maxAttempts
   * @returns {{ isRetryable: boolean, nextAttempt: number, delayMs: number, reason: string }}
   */
  static evaluate({ status, currentAttempt = 1, maxAttempts = 3 }) {
    const cleanStatus = (status || 'PROCESS_ERROR').toUpperCase();

    // User-caused failures are deterministic -> NEVER retry
    if (RetryEngine.USER_NON_RETRYABLE_VERDICTS.includes(cleanStatus)) {
      return {
        isRetryable: false,
        nextAttempt: currentAttempt,
        delayMs: 0,
        reason: `Verdict '${cleanStatus}' is a deterministic user result and is non-retryable.`
      };
    }

    // Check retry bounds
    if (currentAttempt >= maxAttempts) {
      return {
        isRetryable: false,
        nextAttempt: currentAttempt,
        delayMs: 0,
        reason: `Execution failed with '${cleanStatus}' and reached maximum attempt threshold (${maxAttempts}).`
      };
    }

    // Infrastructure failures -> Retry with exponential backoff
    const nextAttempt = currentAttempt + 1;
    const baseDelayMs = 500;
    const delayMs = Math.min(10000, baseDelayMs * Math.pow(2, currentAttempt - 1));

    return {
      isRetryable: true,
      nextAttempt,
      delayMs,
      reason: `Execution encountered infrastructure error '${cleanStatus}'. Scheduled retry attempt ${nextAttempt}/${maxAttempts} in ${delayMs}ms.`
    };
  }
}
