import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';
import { DistinctArrayPlugin } from './DistinctArrayPlugin.js';

/**
 * BSTGeneratorPlugin - Reusable Pattern Plugin for Binary Search Tree Problems
 * Generates valid BST level-order arrays satisfying Left < Node < Right.
 */
export class BSTGeneratorPlugin extends BaseGeneratorPlugin {
  constructor() {
    super('BSTGeneratorPlugin', 'TreePrimitive');
    this.distinctPlugin = new DistinctArrayPlugin();
  }

  /**
   * Helper to build level-order array from a BST root node.
   */
  static buildLevelOrder(rootNode) {
    if (!rootNode) return [];
    const result = [];
    const queue = [rootNode];

    while (queue.length > 0) {
      const current = queue.shift();
      if (current === null) {
        result.push(null);
      } else {
        result.push(current.val);
        queue.push(current.left);
        queue.push(current.right);
      }
    }

    while (result.length > 0 && result[result.length - 1] === null) {
      result.pop();
    }
    return result;
  }

  /**
   * Generates a BST input object { input: { [paramName]: (number | null)[] } }.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   * @returns {{ input: Object, expectedOutput: null }}
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    const { input } = this.distinctPlugin.apply(prng, primitiveData, {
      lengthMin: pluginOptions.nodeCountMin || 5,
      lengthMax: pluginOptions.nodeCountMax || 15,
      valueMin: pluginOptions.valueMin || 1,
      valueMax: pluginOptions.valueMax || 100
    });

    const sortedValues = input.nums.sort((a, b) => a - b);

    function buildBST(arr, start, end) {
      if (start > end) return null;
      const mid = Math.floor((start + end) / 2);
      return {
        val: arr[mid],
        left: buildBST(arr, start, mid - 1),
        right: buildBST(arr, mid + 1, end)
      };
    }

    const root = buildBST(sortedValues, 0, sortedValues.length - 1);
    const levelOrderArray = BSTGeneratorPlugin.buildLevelOrder(root);
    const paramName = pluginOptions.paramName || 'root';

    return {
      input: { [paramName]: levelOrderArray },
      expectedOutput: null
    };
  }
}
