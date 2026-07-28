import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';
import { ArrayPrimitive } from '../primitives/ArrayPrimitive.js';

/**
 * SkewedTreePlugin - Reusable Pattern Plugin for Degenerate / Skewed Tree Problems
 * Generates left-skewed or right-skewed binary tree level-order arrays (Height H = N).
 */
export class SkewedTreePlugin extends BaseGeneratorPlugin {
  constructor() {
    super('SkewedTreePlugin', 'TreePrimitive');
    this.arrayPrimitive = new ArrayPrimitive();
  }

  /**
   * Generates a skewed tree input object { input: { root: (number | null)[] } }.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   * @param {string} [pluginOptions.direction='right'] - 'left' | 'right'
   * @returns {{ input: { root: (number | null)[] }, expectedOutput: null }}
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    const values = primitiveData || this.arrayPrimitive.generate(prng, {
      lengthMin: pluginOptions.nodeCountMin || 5,
      lengthMax: pluginOptions.nodeCountMax || 10,
      valueMin: pluginOptions.valueMin || 1,
      valueMax: pluginOptions.valueMax || 100
    });

    const direction = pluginOptions.direction || 'right';
    
    // For deep trees (nodeCount > 15), level-order array 2^N exceeds JS max array size.
    // Use compact tree object or level-order array for N <= 15.
    if (values.length > 15 || pluginOptions.format === 'treeObject') {
      let root = null;
      let curr = null;

      for (const val of values) {
        const node = { val, left: null, right: null };
        if (!root) {
          root = node;
          curr = node;
        } else {
          if (direction === 'right') {
            curr.right = node;
          } else {
            curr.left = node;
          }
          curr = node;
        }
      }

      return {
        input: { root },
        expectedOutput: null
      };
    }

    // Level-order array representation for N <= 15
    const result = [];
    if (direction === 'right') {
      for (let i = 0; i < values.length; i++) {
        const idx = Math.pow(2, i + 1) - 2;
        while (result.length < idx) result.push(null);
        result[idx] = values[i];
      }
    } else {
      for (let i = 0; i < values.length; i++) {
        const idx = Math.pow(2, i) - 1;
        while (result.length < idx) result.push(null);
        result[idx] = values[i];
      }
    }

    for (let i = 0; i < result.length; i++) {
      if (result[i] === undefined) result[i] = null;
    }

    while (result.length > 0 && result[result.length - 1] === null) {
      result.pop();
    }

    return {
      input: { root: result },
      expectedOutput: null
    };
  }
}
