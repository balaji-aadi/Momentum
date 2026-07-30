import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';

/**
 * DistinctArrayPlugin - Reusable Pattern Plugin for Unique Element Array Problems
 * Guarantees no duplicate values exist in the generated array.
 */
export class DistinctArrayPlugin extends BaseGeneratorPlugin {
  constructor() {
    super('DistinctArrayPlugin', 'ArrayPrimitive');
  }

  /**
   * Generates a distinct element array problem input object.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   * @returns {{ input: Object, expectedOutput: null }}
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    const {
      lengthMin = 5,
      lengthMax = 15,
      valueMin = 1,
      valueMax = 100
    } = pluginOptions;

    const length = prng.nextInt(lengthMin, lengthMax);
    const set = new Set();
    const rangeSize = valueMax - valueMin + 1;
    const targetCount = Math.min(length, rangeSize);

    while (set.size < targetCount) {
      set.add(prng.nextInt(valueMin, valueMax));
    }

    const nums = Array.from(set);
    const paramName = pluginOptions.paramName || 'nums';

    return {
      input: { [paramName]: nums },
      expectedOutput: null
    };
  }
}
