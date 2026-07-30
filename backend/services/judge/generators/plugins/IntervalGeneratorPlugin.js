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
   * Generates an interval problem input object { input: { [paramName]: number[][] } }.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   * @returns {{ input: Object, expectedOutput: null }}
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

    const paramName = pluginOptions.paramName || 'intervals';

    return {
      input: { [paramName]: intervals },
      expectedOutput: null
    };
  }
}
