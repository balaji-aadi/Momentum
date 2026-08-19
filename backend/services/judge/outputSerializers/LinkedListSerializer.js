import { CycleDetectedError } from './SerializerErrors.js';

/**
 * Linked List Output Serializer (Phase 4)
 * Converts `ListNode` head pointer `ListNode(1) -> ListNode(2) -> ...` into canonical JSON array `[1, 2, ...]`.
 * Enforces strict deterministic CycleDetectedError policy on unexpected cycles.
 */
export class LinkedListSerializer {
  static serialize(head) {
    if (head === null || head === undefined) return [];

    if (Array.isArray(head)) return head; // Already serialized array representation

    const result = [];
    const visited = new Set();
    let current = head;
    let stepCount = 0;
    const MAX_STEPS = 100000;

    while (current !== null && current !== undefined) {
      if (visited.has(current) || stepCount > MAX_STEPS) {
        throw new CycleDetectedError('LinkedList', `Cycle encountered at node with val '${current?.val}'`);
      }
      visited.add(current);

      result.push(current.val !== undefined ? current.val : current);
      current = current.next;
      stepCount++;
    }

    return result;
  }
}
