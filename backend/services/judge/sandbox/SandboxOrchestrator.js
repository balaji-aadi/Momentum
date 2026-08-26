import { DockerSandboxExecutor, isDockerAvailable } from './DockerSandboxExecutor.js';
import { RuntimeProcessExecutor } from '../runners/RuntimeProcessExecutor.js';
import { normalizeExecutionLimits } from './ExecutionLimits.js';
import { createProcessExecutionResult } from '../runners/ProcessErrors.js';

export class SandboxOrchestrator {
  /**
   * Executes source code with sandbox isolation or explicit development host fallback.
   * 
   * @param {Object} params
   * @param {string} params.language
   * @param {string} params.sourceCode
   * @param {Object} [params.executionLimits]
   * @param {number} [params.testCasesCount]
   * @param {boolean} [params.strictSandboxMode]
   * @returns {Promise<Object>} ProcessExecutionResult
   */
  static async execute({
    language,
    sourceCode,
    executionLimits = {},
    testCasesCount = 1,
    strictSandboxMode = false
  }) {
    const limits = normalizeExecutionLimits(executionLimits);
    const dockerAvailable = isDockerAvailable();

    // 1. Production Container Sandbox Path
    if (dockerAvailable) {
      return await DockerSandboxExecutor.execute({
        language,
        sourceCode,
        executionLimits: limits,
        testCasesCount
      });
    }

    // 2. Strict Production Sandbox Enforcement & gVisor Security Gate
    const isStrict = strictSandboxMode || process.env.STRICT_SANDBOX_MODE === 'true' || process.env.NODE_ENV === 'production';
    const isStrictGvisor = process.env.JUDGE_STRICT_GVISOR_REQUIRED === 'true';

    if (isStrictGvisor && !dockerAvailable) {
      return createProcessExecutionResult({
        status: 'SANDBOX_UNAVAILABLE',
        error: 'Strict gVisor security mode enabled, but container runtime is unavailable. Zero security downgrade allowed.'
      });
    }

    if (isStrict && !dockerAvailable) {
      return createProcessExecutionResult({
        status: 'SANDBOX_UNAVAILABLE',
        error: 'Production container sandbox is unavailable in this environment.'
      });
    }

    // 3. Development Host Fallback Path (Hardened Phase 7 Executor)
    const hostResult = await RuntimeProcessExecutor.executeProgram({
      language,
      sourceCode,
      timeLimitMs: limits.timeLimitMs,
      testCasesCount,
      maxOutputBytes: limits.outputLimitBytes,
      maxMemoryMb: limits.memoryLimitMb
    });

    // Check for simulated/host memory limit exhaustion
    if (hostResult.stderr && hostResult.stderr.includes('JavaScript heap out of memory')) {
      return createProcessExecutionResult({
        status: 'MEMORY_LIMIT_EXCEEDED',
        error: `Process exceeded allocated memory limit (${limits.memoryLimitMb}MB).`,
        executionTimeMs: hostResult.executionTimeMs,
        stdout: hostResult.stdout,
        stderr: hostResult.stderr
      });
    }

    return hostResult;
  }
}
