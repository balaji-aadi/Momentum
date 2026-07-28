import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';
import { ArrayPrimitive } from '../primitives/ArrayPrimitive.js';

/**
 * SlidingWindowPlugin - Reusable Pattern Plugin for Sliding Window Problems
 * Generates an array `nums` and a window size integer `k`.
 */
export class SlidingWindowPlugin extends BaseGeneratorPlugin {
  constructor() {
    super('SlidingWindowPlugin', 'ArrayPrimitive');
    this.arrayPrimitive = new ArrayPrimitive();
  }

  /**
   * Generates a sliding window problem input object { input: { nums: number[], k: number } }.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   * @param {number} [pluginOptions.kMin=1] - Min window size k
   * @param {number} [pluginOptions.kMax] - Max window size k (defaults to nums.length)
   * @returns {{ input: { nums: number[], k: number }, expectedOutput: null }}
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    const nums = primitiveData || this.arrayPrimitive.generate(prng, pluginOptions);
    const kMin = Math.max(1, pluginOptions.kMin || 1);
    const kMax = Math.min(nums.length, pluginOptions.kMax || nums.length);
    const k = prng.nextInt(kMin, Math.max(kMin, kMax));

    return {
      input: { nums, k },
      expectedOutput: null
    };
  }
}
