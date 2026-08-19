/**
 * Execution Limits & Resource Configuration Contract (Phase 10)
 */

export const PLATFORM_LIMIT_MAXIMUMS = {
  MAX_TIME_LIMIT_MS: 15000,
  MAX_MEMORY_LIMIT_MB: 1024,
  MAX_OUTPUT_LIMIT_BYTES: 5 * 1024 * 1024, // 5 MB
  MAX_CPU_LIMIT: 2.0,
  MAX_PROCESS_LIMIT: 128
};

export const DEFAULT_EXECUTION_LIMITS = {
  timeLimitMs: 2000,
  memoryLimitMb: 256,
  outputLimitBytes: 2 * 1024 * 1024, // 2 MB
  cpuLimit: 1.0,
  processLimit: 64,
  networkEnabled: false
};

/**
 * Normalizes and clamps execution limits against platform security policies.
 * 
 * @param {Object} [customLimits] Optional custom overrides from problem definition
 * @returns {Object} Validated and clamped ExecutionLimits
 */
export function normalizeExecutionLimits(customLimits = {}) {
  const timeLimitMs = Math.min(
    PLATFORM_LIMIT_MAXIMUMS.MAX_TIME_LIMIT_MS,
    Math.max(500, Number(customLimits.timeLimitMs) || DEFAULT_EXECUTION_LIMITS.timeLimitMs)
  );

  const memoryLimitMb = Math.min(
    PLATFORM_LIMIT_MAXIMUMS.MAX_MEMORY_LIMIT_MB,
    Math.max(32, Number(customLimits.memoryLimitMb) || DEFAULT_EXECUTION_LIMITS.memoryLimitMb)
  );

  const outputLimitBytes = Math.min(
    PLATFORM_LIMIT_MAXIMUMS.MAX_OUTPUT_LIMIT_BYTES,
    Math.max(1024, Number(customLimits.outputLimitBytes) || DEFAULT_EXECUTION_LIMITS.outputLimitBytes)
  );

  const cpuLimit = Math.min(
    PLATFORM_LIMIT_MAXIMUMS.MAX_CPU_LIMIT,
    Math.max(0.1, Number(customLimits.cpuLimit) || DEFAULT_EXECUTION_LIMITS.cpuLimit)
  );

  const processLimit = Math.min(
    PLATFORM_LIMIT_MAXIMUMS.MAX_PROCESS_LIMIT,
    Math.max(10, Number(customLimits.processLimit) || DEFAULT_EXECUTION_LIMITS.processLimit)
  );

  return {
    timeLimitMs,
    memoryLimitMb,
    outputLimitBytes,
    cpuLimit,
    processLimit,
    networkEnabled: false // Strictly non-configurable for untrusted student code
  };
}
