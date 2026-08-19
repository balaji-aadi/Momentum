import { normalizeCanonicalType } from '../../../../shared/templateGenerator.js';

/**
 * Type-Aware Expected Output Normalizer (Phase 5)
 * 
 * Normalizes expected output from MongoDB testcases into canonical form
 * strictly respecting the problem's declared returnType.
 * 
 * Example:
 * - returnType: 'string', expected: '42' -> preserves string '42' (does NOT coerce to number 42).
 * - returnType: 'number', expected: '42' -> normalizes to number 42.
 * - returnType: 'boolean', expected: 'true' -> normalizes to boolean true.
 * - returnType: 'number[]', expected: '[1,2,3]' -> parses to [1, 2, 3].
 */
export function normalizeExpectedOutput(expectedOutput, returnType = 'string') {
  if (expectedOutput === null || expectedOutput === undefined) {
    return null;
  }

  const canonicalType = normalizeCanonicalType(returnType);

  // 1. String Return Type: Preserve strings strictly
  if (canonicalType === 'string') {
    if (typeof expectedOutput === 'string') {
      // If it's wrapped in explicit JSON quotes e.g. "\"hello\"", unwrap it
      if (expectedOutput.startsWith('"') && expectedOutput.endsWith('"') && expectedOutput.length >= 2) {
        try {
          return JSON.parse(expectedOutput);
        } catch (e) {
          return expectedOutput;
        }
      }
      return expectedOutput;
    }
    return String(expectedOutput);
  }

  // 2. Number Return Type
  if (canonicalType === 'number') {
    if (typeof expectedOutput === 'number') {
      return isNaN(expectedOutput) ? null : expectedOutput;
    }
    const parsed = Number(expectedOutput);
    return isNaN(parsed) ? null : parsed;
  }

  // 3. Boolean Return Type
  if (canonicalType === 'boolean') {
    if (typeof expectedOutput === 'boolean') return expectedOutput;
    if (expectedOutput === 'true') return true;
    if (expectedOutput === 'false') return false;
    return Boolean(expectedOutput);
  }

  // 4. Arrays, Matrices, Linked Lists, Trees, Graphs
  if (typeof expectedOutput === 'string') {
    const trimmed = expectedOutput.trim();
    if (
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))
    ) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        return expectedOutput;
      }
    }
  }

  return expectedOutput;
}
