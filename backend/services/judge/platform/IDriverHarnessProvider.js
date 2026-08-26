/**
 * IDriverHarnessProvider - Abstract Driver Harness Provider Interface
 * (Phase 15 DSA Platform Module - Stage 15.3)
 * 
 * Defines the contract for generating language-specific driver test harnesses
 * from declarative problem metadata without modifying frozen judge engine modules.
 */
export class IDriverHarnessProvider {
  /**
   * Generates a complete test harness source file by combining problem metadata,
   * student code, and harness template.
   * 
   * @param {Object} problemConfig Canonical DSA problem metadata object
   * @param {string} studentCode Solution submitted by student
   * @param {string} language Target language identifier ('cpp', 'python', 'java', 'js')
   * @returns {Promise<Object>} Object containing resolved source code and compiler/runtime config
   */
  async generateHarness(problemConfig, studentCode, language) {
    throw new Error("IDriverHarnessProvider.generateHarness: Must be implemented by concrete subclass.");
  }

  /**
   * Validates whether a problem metadata definition conforms to the canonical contract.
   * 
   * @param {Object} problemConfig Candidate problem definition
   * @returns {Object} { isValid: boolean, errors: Array<string> }
   */
  validateProblemSchema(problemConfig) {
    throw new Error("IDriverHarnessProvider.validateProblemSchema: Must be implemented by concrete subclass.");
  }
}
