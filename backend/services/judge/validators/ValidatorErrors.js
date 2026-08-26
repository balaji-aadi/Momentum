/**
 * Semantic Validator Errors (Phase 4.5)
 */

export class UnsupportedSemanticValidatorError extends Error {
  constructor(validatorName) {
    super(`Unsupported or unregistered semantic validator '${validatorName}'.`);
    this.name = 'UnsupportedSemanticValidatorError';
    this.validatorName = validatorName;
  }
}

export class MemoryIdentityViolationError extends Error {
  constructor(message = 'Memory Identity Violation: Returned object graph contains original input nodes instead of a deep copy.') {
    super(message);
    this.name = 'MemoryIdentityViolationError';
  }
}
