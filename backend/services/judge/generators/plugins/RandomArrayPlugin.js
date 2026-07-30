import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';
import { ArrayPrimitive } from '../primitives/ArrayPrimitive.js';

/**
 * RandomArrayPlugin - Reusable Pattern Plugin for Random Array Problems
 * Wraps ArrayPrimitive and returns input object format { input: { [paramName]: number[] } }
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
   * @returns {{ input: Object, expectedOutput: null }}
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    const nums = primitiveData || this.arrayPrimitive.generate(prng, pluginOptions);
    const paramName = pluginOptions.paramName || 'nums';
    return {
      input: { [paramName]: nums },
      expectedOutput: null
    };
  }
}
