/**
 * System Component Contracts & Interfaces for DSA Platform (Phase 1.5)
 * Defines formal specifications for Generators, Plugins, Validators, Reference Runners, Normalizers, and Comparators.
 */

/**
 * Interface Contract Spec: IPrimitiveGenerator
 * Generates raw primitive data structures (Arrays, Strings, Matrices, Trees, Graphs).
 */
export class BasePrimitiveGenerator {
  constructor(name, category) {
    this.name = name;
    this.category = category;
  }

  /**
   * Generates a raw primitive data structure.
   * @param {SeededPRNG} prng
   * @param {Object} options
   * @returns {any}
   */
  generate(prng, options = {}) {
    throw new Error(`Method generate() must be implemented by subclass ${this.constructor.name}`);
  }
}

/**
 * Interface Contract Spec: IGeneratorPlugin
 * Transforms primitive structures into problem-specific testcase formats.
 */
export class BaseGeneratorPlugin {
  constructor(name, supportedPrimitive) {
    this.name = name;
    this.supportedPrimitive = supportedPrimitive;
  }

  /**
   * Applies pattern plugin logic over primitive data.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   * @returns {Object} { input: any, expectedOutput: any }
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    throw new Error(`Method apply() must be implemented by subclass ${this.constructor.name}`);
  }
}

/**
 * Interface Contract Spec: IValidator
 * Verifies problem invariants and range constraints.
 */
export class BaseValidator {
  /**
   * Validates generated input against constraints.
   * @param {any} input
   * @param {Object} constraints
   * @returns {{ valid: boolean, reason?: string }}
   */
  validate(input, constraints = {}) {
    throw new Error(`Method validate() must be implemented by subclass ${this.constructor.name}`);
  }
}

/**
 * Interface Contract Spec: INormalizer
 * Pre-comparison output transformation.
 */
export class BaseNormalizer {
  /**
   * Normalizes output before comparison.
   * @param {any} value
   * @param {Object} options
   * @returns {any}
   */
  normalize(value, options = {}) {
    return value;
  }
}

/**
 * Interface Contract Spec: IComparator
 * Evaluates actual student output vs expected reference output.
 */
export class BaseComparator {
  /**
   * Compares normalized outputs.
   * @param {any} actual
   * @param {any} expected
   * @param {Object} options
   * @returns {{ match: boolean, message?: string }}
   */
  compare(actual, expected, options = {}) {
    throw new Error(`Method compare() must be implemented by subclass ${this.constructor.name}`);
  }
}
