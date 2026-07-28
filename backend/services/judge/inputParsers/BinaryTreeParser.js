import { TreeNode } from './nodes.js';

/**
 * Binary Tree Input Parser
 * Converts level-order BFS array `[1, null, 2, 3]` into a TreeNode hierarchy.
 */

export class BinaryTreeParser {
  static parse(val) {
    if (val === null || val === undefined) return null;

    let arrayVal = val;
    if (typeof val === 'string') {
      try {
        arrayVal = JSON.parse(val);
      } catch (e) {
        throw new Error(`BinaryTreeParser: Unable to parse JSON array string '${val}'`);
      }
    }

    if (!Array.isArray(arrayVal)) {
      if (typeof arrayVal === 'object' && arrayVal !== null && 'val' in arrayVal) {
        return arrayVal; // Already a TreeNode structure
      }
      throw new Error(`BinaryTreeParser: Expected BFS array to convert to TreeNode, received ${typeof arrayVal}`);
    }

    if (arrayVal.length === 0 || arrayVal[0] === null || arrayVal[0] === undefined) {
      return null;
    }

    const root = new TreeNode(arrayVal[0]);
    const queue = [root];
    let i = 1;

    while (queue.length > 0 && i < arrayVal.length) {
      const current = queue.shift();

      // Left Child
      if (i < arrayVal.length) {
        const leftVal = arrayVal[i++];
        if (leftVal !== null && leftVal !== undefined) {
          current.left = new TreeNode(leftVal);
          queue.push(current.left);
        }
      }

      // Right Child
      if (i < arrayVal.length) {
        const rightVal = arrayVal[i++];
        if (rightVal !== null && rightVal !== undefined) {
          current.right = new TreeNode(rightVal);
          queue.push(current.right);
        }
      }
    }

    return root;
  }
}
