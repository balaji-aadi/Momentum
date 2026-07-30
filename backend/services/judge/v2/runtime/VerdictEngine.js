/**
 * VerdictEngine - Standardized Judge Verdict Classifier (v4.1)
 */
export class VerdictEngine {
  static VERDICTS = {
    ACCEPTED: 'ACCEPTED',
    WRONG_ANSWER: 'WRONG_ANSWER',
    TIME_LIMIT_EXCEEDED: 'TIME_LIMIT_EXCEEDED',
    MEMORY_LIMIT_EXCEEDED: 'MEMORY_LIMIT_EXCEEDED',
    RUNTIME_ERROR: 'RUNTIME_ERROR',
    COMPILATION_ERROR: 'COMPILATION_ERROR'
  };

  static evaluateCase({ isMatch, actualOutput, expectedOutput, executionTimeMs, memoryMb, limits = {}, error = null }) {
    const timeLimitMs = limits.timeLimitMs || 2000;
    const memoryLimitMb = limits.memoryLimitMb || 256;

    if (error) {
      if (error.code === 'TLE' || executionTimeMs > timeLimitMs) {
        return { status: this.VERDICTS.TIME_LIMIT_EXCEEDED, executionTimeMs, memoryMb, error: error.message };
      }
      if (error.code === 'MLE' || memoryMb > memoryLimitMb) {
        return { status: this.VERDICTS.MEMORY_LIMIT_EXCEEDED, executionTimeMs, memoryMb, error: error.message };
      }
      if (error.code === 'CE') {
        return { status: this.VERDICTS.COMPILATION_ERROR, executionTimeMs: 0, memoryMb: 0, error: error.message };
      }
      return { status: this.VERDICTS.RUNTIME_ERROR, executionTimeMs, memoryMb, error: error.message };
    }

    if (executionTimeMs > timeLimitMs) {
      return { status: this.VERDICTS.TIME_LIMIT_EXCEEDED, executionTimeMs, memoryMb };
    }

    if (memoryMb > memoryLimitMb) {
      return { status: this.VERDICTS.MEMORY_LIMIT_EXCEEDED, executionTimeMs, memoryMb };
    }

    if (isMatch) {
      return { status: this.VERDICTS.ACCEPTED, executionTimeMs, memoryMb };
    }

    return {
      status: this.VERDICTS.WRONG_ANSWER,
      executionTimeMs,
      memoryMb,
      actualOutput,
      expectedOutput
    };
  }
}
