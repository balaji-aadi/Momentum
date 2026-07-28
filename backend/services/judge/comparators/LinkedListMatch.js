import { LinkedListSerializer } from '../outputSerializers/LinkedListSerializer.js';

/**
 * Linked List Match Comparator
 * Compares node value sequences for linked lists (`[1, 2, 3]` vs `[1, 2, 3]`).
 */

export class LinkedListMatch {
  static compare(actual, expected) {
    const listActual = LinkedListSerializer.serialize(actual);
    const listExpected = LinkedListSerializer.serialize(expected);

    const jsonActual = JSON.stringify(listActual);
    const jsonExpected = JSON.stringify(listExpected);

    if (jsonActual === jsonExpected) {
      return { match: true };
    }

    return {
      match: false,
      message: `Linked List mismatch. Expected ${jsonExpected}, received ${jsonActual}`
    };
  }
}
