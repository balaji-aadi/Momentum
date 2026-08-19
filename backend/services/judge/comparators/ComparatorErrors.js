/**
 * Comparator Error Definitions & Result Factory (Phase 5)
 */

export class UnsupportedComparatorError extends Error {
  constructor(comparatorName) {
    super(`[UnsupportedComparatorError] Comparator '${comparatorName}' is not registered in ComparatorRegistry.`);
    this.name = 'UnsupportedComparatorError';
    this.comparatorName = comparatorName;
  }
}

/**
 * Creates a standardized, machine-readable ComparisonResult object.
 * 
 * @param {boolean} passed Whether the actual output matches the expected output
 * @param {string} comparator Name of the comparator used (e.g. 'ExactMatch', 'UnorderedArrayMatch')
 * @param {string} code Machine-readable diagnostic code (e.g. 'MATCH', 'ELEMENT_MISMATCH', etc.)
 * @param {string} reason Human-readable diagnostic description
 * @param {any} expected Normalized expected output
 * @param {any} actual Normalized actual output
 * @param {Object} details Optional structured error metadata (index, diff, etc.)
 */
export function createComparisonResult(passed, comparator, code, reason, expected, actual, details = {}) {
  return {
    passed,
    match: passed, // Backward compatibility alias
    comparator,
    code,
    reason,
    expected,
    actual,
    details
  };
}
