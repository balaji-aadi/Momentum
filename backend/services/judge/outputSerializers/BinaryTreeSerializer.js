/**
 * Binary Tree Output Serializer (Phase 4)
 * Converts `TreeNode` hierarchy back into canonical BFS level-order JSON array `[1, null, 2, 3]`.
 * Automatically trims redundant trailing null values.
 */
export class BinaryTreeSerializer {
  static serialize(root) {
    if (root === null || root === undefined) return [];

    if (Array.isArray(root)) return root; // Already serialized array

    const result = [];
    const queue = [root];

    while (queue.length > 0) {
      const current = queue.shift();

      if (current === null || current === undefined) {
        result.push(null);
      } else {
        result.push(current.val !== undefined ? current.val : current);
        queue.push(current.left || null);
        queue.push(current.right || null);
      }
    }

    // Trim trailing nulls (LeetCode standard canonical representation)
    while (result.length > 0 && result[result.length - 1] === null) {
      result.pop();
    }

    return result;
  }
}
