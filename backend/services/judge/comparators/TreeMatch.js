import { createComparisonResult } from './ComparatorErrors.js';
import { BinaryTreeSerializer } from '../outputSerializers/BinaryTreeSerializer.js';

/**
 * Binary Tree Match Comparator (Phase 5)
 * Compares canonical BFS level-order binary tree representations.
 */
export class TreeMatch {
  static compare(actual, expected) {
    const COMP_NAME = 'TreeMatch';

    const normActual = Array.isArray(actual) ? actual : BinaryTreeSerializer.serialize(actual);
    const normExpected = Array.isArray(expected) ? expected : BinaryTreeSerializer.serialize(expected);

    // 1. Null Checks
    if (normActual.length === 0 && normExpected.length === 0) {
      return createComparisonResult(true, COMP_NAME, 'MATCH', 'Both trees are empty.', normExpected, normActual);
    }
    if (normActual.length === 0 && normExpected.length > 0) {
      return createComparisonResult(false, COMP_NAME, 'STRUCTURE_MISMATCH', 'Expected non-empty tree, received empty tree.', normExpected, normActual);
    }
    if (normActual.length > 0 && normExpected.length === 0) {
      return createComparisonResult(false, COMP_NAME, 'STRUCTURE_MISMATCH', 'Expected empty tree, received non-empty tree.', normExpected, normActual);
    }

    // 2. Length Checks
    if (normActual.length !== normExpected.length) {
      return createComparisonResult(
        false,
        COMP_NAME,
        'STRUCTURE_MISMATCH',
        `Tree structure BFS length mismatch: expected length ${normExpected.length}, received ${normActual.length}.`,
        normExpected,
        normActual,
        { expectedLength: normExpected.length, actualLength: normActual.length }
      );
    }

    // 3. BFS Position Comparison
    for (let i = 0; i < normExpected.length; i++) {
      const expVal = normExpected[i];
      const actVal = normActual[i];

      if (expVal !== actVal) {
        const isStructural = (expVal === null && actVal !== null) || (expVal !== null && actVal === null);
        const code = isStructural ? 'STRUCTURE_MISMATCH' : 'ELEMENT_MISMATCH';
        const reason = isStructural
          ? `Tree structural mismatch at BFS position ${i}: expected ${expVal === null ? 'null (missing node)' : expVal}, received ${actVal === null ? 'null' : actVal}.`
          : `Tree node value mismatch at BFS position ${i}: expected ${expVal}, received ${actVal}.`;

        return createComparisonResult(
          false,
          COMP_NAME,
          code,
          reason,
          normExpected,
          normActual,
          { bfsIndex: i, expectedValue: expVal, actualValue: actVal, isStructural }
        );
      }
    }

    return createComparisonResult(true, COMP_NAME, 'MATCH', 'Binary tree structures and node values match perfectly.', normExpected, normActual);
  }
}
