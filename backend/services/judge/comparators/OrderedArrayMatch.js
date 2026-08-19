import { createComparisonResult } from './ComparatorErrors.js';

/**
 * Ordered Array Match Comparator (Phase 5)
 * Strict order-sensitive array and matrix comparison.
 */
export class OrderedArrayMatch {
  static compare(actual, expected) {
    const COMP_NAME = 'OrderedArrayMatch';

    // 1. Null Checks
    if (actual === null && expected !== null) {
      return createComparisonResult(false, COMP_NAME, 'NULL_MISMATCH', 'Expected array, received null.', expected, actual);
    }
    if (actual !== null && expected === null) {
      return createComparisonResult(false, COMP_NAME, 'NULL_MISMATCH', 'Expected null, received array.', expected, actual);
    }
    if (actual === null && expected === null) {
      return createComparisonResult(true, COMP_NAME, 'MATCH', 'Both outputs are null.', expected, actual);
    }

    // 2. Array Type Validation
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      return createComparisonResult(
        false,
        COMP_NAME,
        'TYPE_MISMATCH',
        `Expected array format, received actual (${typeof actual}) vs expected (${typeof expected}).`,
        expected,
        actual
      );
    }

    // 3. Length Validation
    if (actual.length !== expected.length) {
      return createComparisonResult(
        false,
        COMP_NAME,
        'LENGTH_MISMATCH',
        `Array length mismatch: expected ${expected.length}, received ${actual.length}.`,
        expected,
        actual,
        { expectedLength: expected.length, actualLength: actual.length }
      );
    }

    // 4. Element-by-Element Index Comparison
    for (let i = 0; i < expected.length; i++) {
      const actElem = actual[i];
      const expElem = expected[i];

      const actJson = JSON.stringify(actElem);
      const expJson = JSON.stringify(expElem);

      if (actJson !== expJson) {
        return createComparisonResult(
          false,
          COMP_NAME,
          'ELEMENT_MISMATCH',
          `Element mismatch at index ${i}: expected ${expJson}, received ${actJson}.`,
          expected,
          actual,
          { index: i, expectedElement: expElem, actualElement: actElem }
        );
      }
    }

    return createComparisonResult(true, COMP_NAME, 'MATCH', 'Ordered array outputs match perfectly.', expected, actual);
  }
}
