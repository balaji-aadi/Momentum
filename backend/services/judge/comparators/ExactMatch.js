import { createComparisonResult } from './ComparatorErrors.js';

/**
 * Exact Match Comparator (Phase 5)
 * Strict primitive and structural equality comparator.
 */
export class ExactMatch {
  static compare(actual, expected) {
    const COMP_NAME = 'ExactMatch';

    // 1. Exact Primitive Identity
    if (actual === expected) {
      return createComparisonResult(true, COMP_NAME, 'MATCH', 'Outputs match exactly.', expected, actual);
    }

    // 2. Null Checks
    if (actual === null && expected !== null) {
      return createComparisonResult(false, COMP_NAME, 'NULL_MISMATCH', `Expected non-null value ${JSON.stringify(expected)}, received null.`, expected, actual);
    }
    if (actual !== null && expected === null) {
      return createComparisonResult(false, COMP_NAME, 'NULL_MISMATCH', `Expected null, received ${JSON.stringify(actual)}.`, expected, actual);
    }

    // 3. Type Discrepancy Checks
    if (typeof actual !== typeof expected) {
      return createComparisonResult(false, COMP_NAME, 'TYPE_MISMATCH', `Type mismatch: expected ${typeof expected} (${JSON.stringify(expected)}), received ${typeof actual} (${JSON.stringify(actual)}).`, expected, actual);
    }

    // 4. Array / Structural Deep Comparison
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);

    if (actualStr === expectedStr) {
      return createComparisonResult(true, COMP_NAME, 'MATCH', 'Outputs match exactly.', expected, actual);
    }

    return createComparisonResult(
      false,
      COMP_NAME,
      'ELEMENT_MISMATCH',
      `Value mismatch: expected ${expectedStr}, received ${actualStr}.`,
      expected,
      actual,
      { expectedStr, actualStr }
    );
  }
}
