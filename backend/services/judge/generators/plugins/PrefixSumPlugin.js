import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';
import { ArrayPrimitive } from '../primitives/ArrayPrimitive.js';

/**
 * PrefixSumPlugin - Reusable Pattern Plugin for Prefix Sum / Range Query Problems
 * Generates an array `nums` and a list of query ranges `queries: [[L, R], ...]`.
 */
export class PrefixSumPlugin extends BaseGeneratorPlugin {
  constructor() {
    super('PrefixSumPlugin', 'ArrayPrimitive');
    this.arrayPrimitive = new ArrayPrimitive();
  }

  /**
   * Generates a prefix sum / range query input object { input: { nums: number[], queries: number[][] } }.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   * @param {number} [pluginOptions.queryCountMin=3] - Min query count
   * @param {number} [pluginOptions.queryCountMax=8] - Max query count
   * @returns {{ input: { nums: number[], queries: number[][] }, expectedOutput: null }}
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    const nums = primitiveData || this.arrayPrimitive.generate(prng, pluginOptions);
    const { queryCountMin = 3, queryCountMax = 8 } = pluginOptions;
    const queryCount = prng.nextInt(queryCountMin, queryCountMax);
    const queries = [];

    for (let q = 0; q < queryCount; q++) {
      const idx1 = prng.nextInt(0, nums.length - 1);
      const idx2 = prng.nextInt(0, nums.length - 1);
      const L = Math.min(idx1, idx2);
      const R = Math.max(idx1, idx2);
      queries.push([L, R]);
    }

    return {
      input: { nums, queries },
      expectedOutput: null
    };
  }
}
