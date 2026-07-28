import { BinaryTreeSerializer } from '../outputSerializers/BinaryTreeSerializer.js';

/**
 * Tree Match Comparator
 * Compares structural BFS level-order binary tree sequences (`[1, null, 2, 3]` vs `[1, null, 2, 3]`).
 */

export class TreeMatch {
  static compare(actual, expected) {
    const treeActual = BinaryTreeSerializer.serialize(actual);
    const treeExpected = BinaryTreeSerializer.serialize(expected);

    const jsonActual = JSON.stringify(treeActual);
    const jsonExpected = JSON.stringify(treeExpected);

    if (jsonActual === jsonExpected) {
      return { match: true };
    }

    return {
      match: false,
      message: `Binary Tree mismatch. Expected ${jsonExpected}, received ${jsonActual}`
    };
  }
}
