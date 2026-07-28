import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';
import { DistinctArrayPlugin } from './DistinctArrayPlugin.js';

/**
 * UniquePairGeneratorPlugin - Reusable Pattern Plugin for Two Sum Problems
 * Generates an array `nums` and a `target` integer with a guaranteed valid answer pair.
 */
export class UniquePairGeneratorPlugin extends BaseGeneratorPlugin {
  constructor() {
    super('UniquePairGeneratorPlugin', 'ArrayPrimitive');
    this.distinctPlugin = new DistinctArrayPlugin();
  }

  /**
   * Generates a Two Sum input object { input: { nums, target } }.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   * @returns {{ input: { nums: number[], target: number }, expectedOutput: null }}
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    const { input } = this.distinctPlugin.apply(prng, primitiveData, {
      lengthMin: Math.max(2, pluginOptions.lengthMin || 5),
      lengthMax: pluginOptions.lengthMax || 15,
      valueMin: pluginOptions.valueMin || -100,
      valueMax: pluginOptions.valueMax || 100
    });

    const nums = input.nums;
    if (nums.length < 2) {
      nums.push(nums[0] + 1);
    }

    // Pick two random distinct indices
    const idx1 = prng.nextInt(0, nums.length - 1);
    let idx2 = prng.nextInt(0, nums.length - 1);
    while (idx2 === idx1) {
      idx2 = prng.nextInt(0, nums.length - 1);
    }

    const target = nums[idx1] + nums[idx2];
    const shuffledNums = prng.shuffle(nums);

    return {
      input: { nums: shuffledNums, target },
      expectedOutput: null
    };
  }
}
