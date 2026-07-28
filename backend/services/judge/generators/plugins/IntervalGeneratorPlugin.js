import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';

/**
 * IntervalGeneratorPlugin - Reusable Pattern Plugin for Interval Problems (Merge Intervals, Insert Interval)
 * Generates an array of `[start, end]` ranges.
 */
export class IntervalGeneratorPlugin extends BaseGeneratorPlugin {
  constructor() {
    super('IntervalGeneratorPlugin', 'ArrayPrimitive');
  }

  /**
   * Generates an interval problem input object { input: { intervals: number[][] } }.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   * @param {number} [pluginOptions.countMin=3] - Min intervals count
   * @param {number} [pluginOptions.countMax=10] - Max intervals count
   * @param {number} [pluginOptions.rangeMin=0] - Min bound value
   * @param {number} [pluginOptions.rangeMax=100] - Max bound value
   * @param {boolean} [pluginOptions.sorted=true] - Sort intervals by start value
   * @returns {{ input: { intervals: number[][] }, expectedOutput: null }}
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    const {
      countMin = 3,
      countMax = 10,
      rangeMin = 0,
      rangeMax = 100,
      sorted = true
    } = pluginOptions;

    const count = prng.nextInt(countMin, countMax);
    const intervals = [];

    for (let i = 0; i < count; i++) {
      const v1 = prng.nextInt(rangeMin, rangeMax);
      const v2 = prng.nextInt(rangeMin, rangeMax);
      const start = Math.min(v1, v2);
      const end = Math.max(v1, v2);
      intervals.push([start, end]);
    }

    if (sorted) {
      intervals.sort((a, b) => a[0] - b[0]);
    }

    return {
      input: { intervals },
      expectedOutput: null
    };
  }
}
