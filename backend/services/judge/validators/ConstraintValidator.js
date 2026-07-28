import { BaseValidator } from '../contracts/GeneratorContracts.js';

/**
 * ConstraintValidator - Constraint & Guarantee Validator Engine
 * Asserts that generated testcases satisfy problem range bounds and domain invariants.
 * Automatically retries generation if a candidate input fails validation.
 */
export class ConstraintValidator extends BaseValidator {
  constructor() {
    super();
  }

  /**
   * Main validation entry point.
   * @param {Object} input - Generated candidate input object (e.g. { nums, target })
   * @param {Object} constraints - Rules configuration
   * @returns {{ valid: boolean, reason?: string }}
   */
  validate(input, constraints = {}) {
    if (!input) {
      return { valid: false, reason: "Input object is null or undefined." };
    }

    const {
      rule = 'range',
      minN,
      maxN,
      minValue,
      maxValue,
      customRuleCode
    } = constraints;

    // 1. Array range / length bounds check
    if (minN !== undefined || maxN !== undefined || minValue !== undefined || maxValue !== undefined) {
      const rangeCheck = ConstraintValidator.validateRange(input, constraints);
      if (!rangeCheck.valid) return rangeCheck;
    }

    // 2. Specialized invariant rule check
    switch (rule) {
      case 'twoSum':
        return ConstraintValidator.validateTwoSum(input);
      case 'bst':
        return ConstraintValidator.validateBST(input);
      case 'dag':
        return ConstraintValidator.validateDAG(input);
      case 'connectedGraph':
        return ConstraintValidator.validateConnectedGraph(input);
      case 'custom':
        return ConstraintValidator.validateCustomRule(input, customRuleCode);
      case 'range':
      default:
        return { valid: true };
    }
  }

  /**
   * Validates array lengths and numeric element value ranges.
   */
  static validateRange(input, constraints) {
    const { minN, maxN, minValue, maxValue } = constraints;

    // Check top-level numeric arrays (e.g. input.nums or input.head)
    const arrayTarget = input.nums || input.head || input.intervals;

    if (Array.isArray(arrayTarget)) {
      if (minN !== undefined && arrayTarget.length < minN) {
        return { valid: false, reason: `Array length (${arrayTarget.length}) is below minN (${minN}).` };
      }
      if (maxN !== undefined && arrayTarget.length > maxN) {
        return { valid: false, reason: `Array length (${arrayTarget.length}) exceeds maxN (${maxN}).` };
      }

      if (minValue !== undefined || maxValue !== undefined) {
        for (const item of arrayTarget) {
          if (typeof item === 'number') {
            if (minValue !== undefined && item < minValue) {
              return { valid: false, reason: `Element value (${item}) is below minValue (${minValue}).` };
            }
            if (maxValue !== undefined && item > maxValue) {
              return { valid: false, reason: `Element value (${item}) exceeds maxValue (${maxValue}).` };
            }
          }
        }
      }
    }

    return { valid: true };
  }

  /**
   * Validates Two Sum invariant: nums must contain at least 1 pair summing to target.
   */
  static validateTwoSum(input) {
    const { nums, target } = input;
    if (!Array.isArray(nums) || typeof target !== 'number') {
      return { valid: false, reason: "Two Sum input must contain 'nums' array and 'target' number." };
    }

    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        if (nums[i] + nums[j] === target) {
          return { valid: true };
        }
      }
    }
    return { valid: false, reason: "No pair in nums sums to target." };
  }

  /**
   * Validates BST invariant: tree level-order array must satisfy Left < Node < Right.
   */
  static validateBST(input) {
    const rootArray = input.root;
    if (!Array.isArray(rootArray)) {
      return { valid: false, reason: "BST input must contain level-order array 'root'." };
    }

    function checkBST(idx, minVal, maxVal) {
      if (idx >= rootArray.length || rootArray[idx] === null || rootArray[idx] === undefined) {
        return true;
      }
      const val = rootArray[idx];
      if (minVal !== null && val <= minVal) return false;
      if (maxVal !== null && val >= maxVal) return false;

      return checkBST(2 * idx + 1, minVal, val) && checkBST(2 * idx + 2, val, maxVal);
    }

    const isValid = checkBST(0, null, null);
    return isValid ? { valid: true } : { valid: false, reason: "Tree fails BST Left < Node < Right invariant." };
  }

  /**
   * Validates DAG invariant: graph edges must contain zero directed cycles.
   */
  static validateDAG(input) {
    const { n, edges } = input;
    if (typeof n !== 'number' || !Array.isArray(edges)) {
      return { valid: false, reason: "DAG input must contain vertex count 'n' and 'edges' array." };
    }

    for (const edge of edges) {
      const [u, v] = edge;
      if (u >= v) {
        return { valid: false, reason: `Edge [${u}, ${v}] violates topological u < v ordering rule.` };
      }
    }
    return { valid: true };
  }

  /**
   * Validates Connected Graph invariant: 100% reachability from node 0.
   */
  static validateConnectedGraph(input) {
    const { n, edges } = input;
    if (typeof n !== 'number' || !Array.isArray(edges)) {
      return { valid: false, reason: "Graph input must contain vertex count 'n' and 'edges' array." };
    }

    const adj = Array.from({ length: n }, () => []);
    edges.forEach(edge => {
      const u = edge[0];
      const v = edge[1];
      adj[u].push(v);
      adj[v].push(u);
    });

    const visited = new Set([0]);
    const queue = [0];
    while (queue.length > 0) {
      const curr = queue.shift();
      adj[curr].forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }

    if (visited.size !== n) {
      return { valid: false, reason: `Graph is disconnected. Visited ${visited.size}/${n} nodes.` };
    }
    return { valid: true };
  }

  /**
   * Evaluates user custom JavaScript rule code (input) => boolean.
   */
  static validateCustomRule(input, customRuleCode) {
    if (!customRuleCode || typeof customRuleCode !== 'string') {
      return { valid: true };
    }
    try {
      const fn = new Function('input', customRuleCode);
      const res = fn(input);
      return res ? { valid: true } : { valid: false, reason: "Failed custom validation rule function." };
    } catch (err) {
      return { valid: false, reason: `Custom validator error: ${err.message}` };
    }
  }

  /**
   * Pipeline helper: Repeatedly calls generator/plugin until candidate passes validation.
   */
  static generateValidInput(generatorOrPlugin, prng, pluginOptions = {}, constraints = {}, maxRetries = 50) {
    const validator = new ConstraintValidator();
    let attempts = 0;

    while (attempts < maxRetries) {
      attempts++;
      const candidate = generatorOrPlugin.apply
        ? generatorOrPlugin.apply(prng, null, pluginOptions)
        : { input: { nums: generatorOrPlugin.generate(prng, pluginOptions) }, expectedOutput: null };

      const check = validator.validate(candidate.input || candidate, constraints);
      if (check.valid) {
        return { candidate, attempts };
      }
    }

    throw new Error(`ConstraintValidator: Exceeded maxRetries (${maxRetries}) without generating valid input.`);
  }
}
