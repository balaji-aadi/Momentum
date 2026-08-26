/**
 * ISandboxDriver - Abstract Sandbox Driver Interface
 * (Phase 11 Sandbox Driver Interface)
 * 
 * Standardizes process isolation drivers across local dev and container runtimes.
 */
export class ISandboxDriver {
  /**
   * Executes source code inside sandbox environment.
   * 
   * @param {Object} params
   * @param {string} params.language
   * @param {string} params.sourceCode
   * @param {Object} params.executionLimits
   * @param {number} params.testCasesCount
   * @returns {Promise<Object>} Execution result envelope
   */
  async execute(params) {
    throw new Error("ISandboxDriver.execute() must be implemented by subclass.");
  }
}
