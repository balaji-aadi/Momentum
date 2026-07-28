import { BasePrimitiveGenerator } from '../../contracts/GeneratorContracts.js';

/**
 * TreePrimitive - Generic Binary Tree Primitive Data Generator
 * Generates binary trees serialized as level-order arrays (LeetCode format: [1, 2, 3, null, 4]) backed by SeededPRNG.
 */
export class TreePrimitive extends BasePrimitiveGenerator {
  constructor() {
    super('TreePrimitive', 'Trees');
  }

  /**
   * Generates a binary tree as a level-order serialized array.
   * @param {SeededPRNG} prng - Deterministic seed instance
   * @param {Object} options - Generator options
   * @param {number} [options.nodeCountMin=5] - Target min non-null nodes
   * @param {number} [options.nodeCountMax=15] - Target max non-null nodes
   * @param {number} [options.valueMin=1] - Min node value
   * @param {number} [options.valueMax=100] - Max node value
   * @param {number} [options.nullProbability=0.2] - Probability of null child nodes
   * @returns {(number | null)[]}
   */
  generate(prng, options = {}) {
    if (!prng) {
      throw new Error("TreePrimitive requires a valid SeededPRNG instance.");
    }

    const {
      nodeCountMin = 5,
      nodeCountMax = 15,
      valueMin = 1,
      valueMax = 100,
      nullProbability = 0.2
    } = options;

    if (nodeCountMin > nodeCountMax) {
      throw new Error(`Invalid node count range: nodeCountMin (${nodeCountMin}) cannot exceed nodeCountMax (${nodeCountMax})`);
    }

    const targetNodes = prng.nextInt(nodeCountMin, nodeCountMax);
    if (targetNodes <= 0) return [];

    const result = [prng.nextInt(valueMin, valueMax)];
    let activeNodes = 1;

    // Queue of indices of non-null nodes that can accept children
    const openNodes = [0];

    while (activeNodes < targetNodes && openNodes.length > 0) {
      const parentIdx = openNodes.shift();

      // Left child
      if (activeNodes < targetNodes && (openNodes.length === 0 || !prng.nextBool(nullProbability))) {
        const leftIdx = 2 * parentIdx + 1;
        while (result.length < leftIdx) result.push(null);
        result[leftIdx] = prng.nextInt(valueMin, valueMax);
        activeNodes++;
        openNodes.push(leftIdx);
      }

      // Right child
      if (activeNodes < targetNodes && (openNodes.length === 0 || !prng.nextBool(nullProbability))) {
        const rightIdx = 2 * parentIdx + 2;
        while (result.length < rightIdx) result.push(null);
        result[rightIdx] = prng.nextInt(valueMin, valueMax);
        activeNodes++;
        openNodes.push(rightIdx);
      }
    }

    // Fill array gaps up to last non-null element with null
    for (let i = 0; i < result.length; i++) {
      if (result[i] === undefined) result[i] = null;
    }

    // Trim trailing null values to match LeetCode level-order format
    while (result.length > 0 && result[result.length - 1] === null) {
      result.pop();
    }

    return result;
  }
}
