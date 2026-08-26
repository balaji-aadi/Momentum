import { ISandboxDriver } from './ISandboxDriver.js';
import { SandboxOrchestrator } from '../../sandbox/SandboxOrchestrator.js';

/**
 * HostSubprocessSandboxDriver - Tier 1 Minimum Isolation Sandbox Driver
 * (Phase 11 Sandbox Driver Implementation)
 * 
 * Enforces Tier 1 process isolation limits (tmpfs execution directories,
 * static securitySanitizer regex, ulimit/cgroups caps, SIGTERM watchdog).
 */
export class HostSubprocessSandboxDriver extends ISandboxDriver {
  async execute({ language, sourceCode, executionLimits = {}, testCasesCount = 1, strictSandboxMode = false }) {
    return await SandboxOrchestrator.execute({
      language,
      sourceCode,
      executionLimits,
      testCasesCount,
      strictSandboxMode
    });
  }
}
