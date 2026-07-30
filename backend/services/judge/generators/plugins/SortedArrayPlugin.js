import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';
import { ArrayPrimitive } from '../primitives/ArrayPrimitive.js';

/**
 * SortedArrayPlugin - Reusable Pattern Plugin for Sorted Array Problems
 * Sorts input elements in ascending ('asc') or descending ('desc') order.
 */
export class SortedArrayPlugin extends BaseGeneratorPlugin {
  constructor() {
    super('SortedArrayPlugin', 'ArrayPrimitive');
    this.arrayPrimitive = new ArrayPrimitive();
  }

  /**
   * Generates a sorted array problem input object.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   * @param {string} [pluginOptions.order='asc'] - 'asc' | 'desc'
   * @returns {{ input: Object, expectedOutput: null }}
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    const rawNums = primitiveData || this.arrayPrimitive.generate(prng, pluginOptions);
    const order = pluginOptions.order || 'asc';
    const nums = [...rawNums].sort((a, b) => order === 'desc' ? b - a : a - b);
    const paramName = pluginOptions.paramName || 'nums';

    return {
      input: { [paramName]: nums },
      expectedOutput: null
    };
  }
}
