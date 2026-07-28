import { ListNode } from './nodes.js';

/**
 * Linked List Input Parser
 * Converts JSON array `[1, 2, 3, 4]` into a head pointer of `ListNode(1) -> ListNode(2) -> ListNode(3) -> ListNode(4)`.
 */

export class LinkedListParser {
  static parse(val) {
    if (val === null || val === undefined) return null;

    let arrayVal = val;
    if (typeof val === 'string') {
      try {
        arrayVal = JSON.parse(val);
      } catch (e) {
        throw new Error(`LinkedListParser: Unable to parse JSON array string '${val}'`);
      }
    }

    if (!Array.isArray(arrayVal)) {
      if (typeof arrayVal === 'object' && arrayVal !== null && 'val' in arrayVal) {
        return arrayVal; // Already a ListNode structure
      }
      throw new Error(`LinkedListParser: Expected array to convert to ListNode, received ${typeof arrayVal}`);
    }

    if (arrayVal.length === 0) return null;

    const dummy = new ListNode(0);
    let current = dummy;

    for (const item of arrayVal) {
      current.next = new ListNode(item);
      current = current.next;
    }

    return dummy.next;
  }
}
