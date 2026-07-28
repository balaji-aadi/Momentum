import { BaseComparator } from '../contracts/GeneratorContracts.js';

/**
 * FloatToleranceMatch - Extended Floating-Point Precision Comparator
 * Evaluates floating-point numbers or numeric arrays with absolute difference <= epsilon tolerance.
 */
export class FloatToleranceMatch extends BaseComparator {
  static compare(actual, expected, options = {}) {
    const epsilon = options.epsilon || 1e-5;

    const isMatch = FloatToleranceMatch.equalsWithEpsilon(actual, expected, epsilon);

    if (isMatch) {
      return { match: true };
    }

    return {
      match: false,
      diff: `Float mismatch beyond epsilon (${epsilon}). Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`
    };
  }

  compare(actual, expected, options = {}) {
    return FloatToleranceMatch.compare(actual, expected, options);
  }

  static equalsWithEpsilon(a, b, epsilon) {
    if (typeof a === 'number' && typeof b === 'number') {
      return Math.abs(a - b) <= epsilon;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!FloatToleranceMatch.equalsWithEpsilon(a[i], b[i], epsilon)) {
          return false;
        }
      }
      return true;
    }

    if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;

      for (const k of keysA) {
        if (!FloatToleranceMatch.equalsWithEpsilon(a[k], b[k], epsilon)) {
          return false;
        }
      }
      return true;
    }

    return a === b;
  }
}
