import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';
import { LinkedListPrimitive } from '../primitives/LinkedListPrimitive.js';

/**
 * CyclicLinkedListPlugin - Reusable Pattern Plugin for Linked List Cycle Problems
 * Generates node values array `head` and cycle entry index `pos` (-1 for no cycle).
 */
export class CyclicLinkedListPlugin extends BaseGeneratorPlugin {
  constructor() {
    super('CyclicLinkedListPlugin', 'LinkedListPrimitive');
    this.listPrimitive = new LinkedListPrimitive();
  }

  /**
   * Generates a cyclic linked list problem input object { input: { head: number[], pos: number } }.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   * @param {boolean} [pluginOptions.hasCycle=true] - Force cycle creation
   * @returns {{ input: { head: number[], pos: number }, expectedOutput: null }}
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    const head = primitiveData || this.listPrimitive.generate(prng, pluginOptions);
    const hasCycle = pluginOptions.hasCycle !== undefined ? pluginOptions.hasCycle : prng.nextBool(0.7);

    let pos = -1;
    if (hasCycle && head.length > 0) {
      pos = prng.nextInt(0, head.length - 1);
    }

    return {
      input: { head, pos },
      expectedOutput: null
    };
  }
}
