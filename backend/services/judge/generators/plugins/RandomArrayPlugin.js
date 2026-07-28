import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';
import { ArrayPrimitive } from '../primitives/ArrayPrimitive.js';

/**
 * RandomArrayPlugin - Reusable Pattern Plugin for Random Array Problems
 * Wraps ArrayPrimitive and returns input object format { input: { nums: number[] } }
 */
export class RandomArrayPlugin extends BaseGeneratorPlugin {
  constructor() {
    super('RandomArrayPlugin', 'ArrayPrimitive');
    this.arrayPrimitive = new ArrayPrimitive();
  }

  /**
   * Generates a random array problem input object.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   * @returns {{ input: { nums: number[] }, expectedOutput: null }}
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    const nums = primitiveData || this.arrayPrimitive.generate(prng, pluginOptions);
    return {
      input: { nums },
      expectedOutput: null
    };
  }
}
