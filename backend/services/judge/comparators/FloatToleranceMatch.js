import { createComparisonResult } from './ComparatorErrors.js';

/**
 * Float Tolerance Match Comparator (Phase 5)
 * Compares floating-point numbers or numeric arrays using absolute and relative epsilon tolerances.
 * Does NOT treat null as a valid float.
 */
export class FloatToleranceMatch {
  static compare(actual, expected, options = {}) {
    const COMP_NAME = 'FloatToleranceMatch';
    const absTol = options.absTol !== undefined ? options.absTol : (options.epsilon || 1e-5);
    const relTol = options.relTol !== undefined ? options.relTol : 1e-5;

    // 1. Null Checks
    if (actual === null && expected !== null) {
      return createComparisonResult(false, COMP_NAME, 'NULL_MISMATCH', 'Expected floating-point number, received null.', expected, actual);
    }
    if (actual !== null && expected === null) {
      return createComparisonResult(false, COMP_NAME, 'NULL_MISMATCH', 'Expected null, received floating-point number.', expected, actual);
    }
    if (actual === null && expected === null) {
      return createComparisonResult(true, COMP_NAME, 'MATCH', 'Both float values are null.', expected, actual);
    }

    // 2. Single Number Comparison
    if (typeof actual === 'number' && typeof expected === 'number') {
      const diff = Math.abs(actual - expected);
      const maxMagnitude = Math.max(Math.abs(actual), Math.abs(expected));
      const allowedTol = Math.max(absTol, relTol * maxMagnitude);

      if (diff <= allowedTol) {
        return createComparisonResult(true, COMP_NAME, 'MATCH', 'Float value within tolerance.', expected, actual, { diff, allowedTol });
      }

      return createComparisonResult(
        false,
        COMP_NAME,
        'FLOAT_TOLERANCE_EXCEEDED',
        `Float difference ${diff} exceeds allowed tolerance ${allowedTol}: expected ${expected}, received ${actual}.`,
        expected,
        actual,
        { diff, allowedTol, absTol, relTol }
      );
    }

    // 3. Array of Numbers Comparison
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) {
        return createComparisonResult(
          false,
          COMP_NAME,
          'LENGTH_MISMATCH',
          `Float array length mismatch: expected ${expected.length}, received ${actual.length}.`,
          expected,
          actual,
          { expectedLength: expected.length, actualLength: actual.length }
        );
      }

      for (let i = 0; i < expected.length; i++) {
        const actElem = actual[i];
        const expElem = expected[i];

        if (typeof actElem !== 'number' || typeof expElem !== 'number') {
          return createComparisonResult(
            false,
            COMP_NAME,
            'TYPE_MISMATCH',
            `Element at index ${i} is not a valid number.`,
            expected,
            actual,
            { index: i }
          );
        }

        const diff = Math.abs(actElem - expElem);
        const maxMagnitude = Math.max(Math.abs(actElem), Math.abs(expElem));
        const allowedTol = Math.max(absTol, relTol * maxMagnitude);

        if (diff > allowedTol) {
          return createComparisonResult(
            false,
            COMP_NAME,
            'FLOAT_TOLERANCE_EXCEEDED',
            `Float difference at index ${i} (${diff}) exceeds allowed tolerance ${allowedTol}: expected ${expElem}, received ${actElem}.`,
            expected,
            actual,
            { index: i, diff, allowedTol }
          );
        }
      }

      return createComparisonResult(true, COMP_NAME, 'MATCH', 'All float array elements match within tolerance.', expected, actual);
    }

    return createComparisonResult(
      false,
      COMP_NAME,
      'TYPE_MISMATCH',
      `Type mismatch in float comparison: actual (${typeof actual}) vs expected (${typeof expected}).`,
      expected,
      actual
    );
  }
}
