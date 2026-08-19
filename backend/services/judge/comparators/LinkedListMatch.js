import { createComparisonResult } from './ComparatorErrors.js';
import { LinkedListSerializer } from '../outputSerializers/LinkedListSerializer.js';

/**
 * Linked List Match Comparator (Phase 5)
 * Compares canonical linked list outputs.
 */
export class LinkedListMatch {
  static compare(actual, expected) {
    const COMP_NAME = 'LinkedListMatch';

    // Normalize if passed as raw node objects
    const normActual = Array.isArray(actual) ? actual : LinkedListSerializer.serialize(actual);
    const normExpected = Array.isArray(expected) ? expected : LinkedListSerializer.serialize(expected);

    // 1. Null Checks
    if (normActual === null && normExpected !== null) {
      return createComparisonResult(false, COMP_NAME, 'NULL_MISMATCH', 'Expected linked list, received null.', normExpected, normActual);
    }
    if (normActual !== null && normExpected === null) {
      return createComparisonResult(false, COMP_NAME, 'NULL_MISMATCH', 'Expected null, received linked list.', normExpected, normActual);
    }

    // 2. Length Checks
    if (normActual.length !== normExpected.length) {
      return createComparisonResult(
        false,
        COMP_NAME,
        'LENGTH_MISMATCH',
        `Linked list length mismatch: expected ${normExpected.length} nodes, received ${normActual.length} nodes.`,
        normExpected,
        normActual,
        { expectedLength: normExpected.length, actualLength: normActual.length }
      );
    }

    // 3. Node Value by Node Value
    for (let i = 0; i < normExpected.length; i++) {
      if (normActual[i] !== normExpected[i]) {
        return createComparisonResult(
          false,
          COMP_NAME,
          'ELEMENT_MISMATCH',
          `Node value mismatch at node position ${i + 1}: expected ${normExpected[i]}, received ${normActual[i]}.`,
          normExpected,
          normActual,
          { nodePosition: i + 1, expectedValue: normExpected[i], actualValue: normActual[i] }
        );
      }
    }

    return createComparisonResult(true, COMP_NAME, 'MATCH', 'Linked list structures match perfectly.', normExpected, normActual);
  }
}
