import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';
import { BSTGeneratorPlugin } from './BSTGeneratorPlugin.js';

/**
 * BalancedTreePlugin - Reusable Pattern Plugin for Balanced Binary Tree Problems
 * Guarantees height balance invariant: |height(L) - height(R)| <= 1 at every node.
 */
export class BalancedTreePlugin extends BaseGeneratorPlugin {
  constructor() {
    super('BalancedTreePlugin', 'TreePrimitive');
    this.bstPlugin = new BSTGeneratorPlugin();
  }

  /**
   * Generates a balanced binary tree input object.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   * @returns {{ input: { root: (number | null)[] }, expectedOutput: null }}
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    return this.bstPlugin.apply(prng, primitiveData, pluginOptions);
  }
}
