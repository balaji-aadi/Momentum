import { createComparisonResult } from './ComparatorErrors.js';

/**
 * Unordered Array Match Comparator (Phase 5)
 * 
 * Order-insensitive collection comparator with explicit depth semantics and strict multiset frequency awareness.
 * 
 * Semantics:
 * - depth = 1 (Default): Outer collection is order-insensitive; nested elements are compared with ordered/deep equality.
 * - Frequency/multiset aware: [1, 1, 2] strictly does NOT equal [1, 2].
 */
export class UnorderedArrayMatch {
  static compare(actual, expected, options = {}) {
    const COMP_NAME = 'UnorderedArrayMatch';
    const depth = options.depth !== undefined ? options.depth : 1;

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

    // 2. Array Validation
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
        `Array length mismatch: expected length ${expected.length}, received ${actual.length}.`,
        expected,
        actual,
        { expectedLength: expected.length, actualLength: actual.length }
      );
    }

    // 4. Multiset Frequency Mapping
    const buildFrequencyMap = (arr) => {
      const map = new Map();
      for (const item of arr) {
        // At depth 1: inner array items are serialized with ordered JSON representation
        const key = JSON.stringify(item);
        map.set(key, (map.get(key) || 0) + 1);
      }
      return map;
    };

    const actualFreq = buildFrequencyMap(actual);
    const expectedFreq = buildFrequencyMap(expected);

    for (const [key, expCount] of expectedFreq.entries()) {
      const actCount = actualFreq.get(key) || 0;
      if (actCount !== expCount) {
        return createComparisonResult(
          false,
          COMP_NAME,
          'FREQUENCY_MISMATCH',
          `Element frequency mismatch for ${key}: expected count ${expCount}, received count ${actCount}.`,
          expected,
          actual,
          { element: JSON.parse(key), expectedCount: expCount, actualCount: actCount }
        );
      }
    }

    return createComparisonResult(true, COMP_NAME, 'MATCH', 'Unordered array outputs match with equal element frequencies.', expected, actual);
  }
}
