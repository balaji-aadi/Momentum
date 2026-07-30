import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';

/**
 * RandomListGeneratorPlugin - Reusable Pattern Plugin for Linked Lists with Random Pointers
 * Generates 2D pair arrays [[val, random_index], ...] for LeetCode #138 (Copy List with Random Pointer)
 */
export class RandomListGeneratorPlugin extends BaseGeneratorPlugin {
  constructor() {
    super('RandomListGeneratorPlugin', 'LinkedListPrimitive');
  }

  /**
   * Generates a random list input object { input: { [paramName]: [[val, random_index], ...] } }.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   * @returns {{ input: Object, expectedOutput: null }}
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    const {
      nodeCountMin = 3,
      nodeCountMax = 10,
      valueMin = -100,
      valueMax = 100,
      nullRandomProbability = 0.3,
      paramName = 'head'
    } = pluginOptions;

    const count = prng.nextInt(Math.max(0, nodeCountMin), Math.max(1, nodeCountMax));
    const pairArray = [];

    for (let i = 0; i < count; i++) {
      const val = prng.nextInt(valueMin, valueMax);
      let randomIdx = null;

      if (count > 0 && prng.nextFloat() >= nullRandomProbability) {
        randomIdx = prng.nextInt(0, count - 1);
      }

      pairArray.push([val, randomIdx]);
    }

    return {
      input: { [paramName]: pairArray },
      expectedOutput: null
    };
  }
}
