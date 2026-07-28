/**
 * Linked List Output Serializer
 * Converts `ListNode` head pointer `ListNode(1) -> ListNode(2) -> ListNode(3)` back into JSON array `[1, 2, 3]`.
 */

export class LinkedListSerializer {
  static serialize(head) {
    if (head === null || head === undefined) return [];

    if (Array.isArray(head)) return head; // Already serialized array

    const result = [];
    const visited = new Set();
    let current = head;

    while (current !== null && current !== undefined) {
      if (visited.has(current)) {
        // Cycle detected - break infinite loop
        break;
      }
      visited.add(current);

      result.push(current.val !== undefined ? current.val : current);
      current = current.next;
    }

    return result;
  }
}
