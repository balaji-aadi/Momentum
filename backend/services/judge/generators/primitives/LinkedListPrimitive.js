import { BasePrimitiveGenerator } from '../../contracts/GeneratorContracts.js';

/**
 * LinkedListPrimitive - Generic Linked List Primitive Data Generator
 * Generates linear node value sequences backed by SeededPRNG.
 */
export class LinkedListPrimitive extends BasePrimitiveGenerator {
  constructor() {
    super('LinkedListPrimitive', 'LinkedLists');
  }

  /**
   * Generates a linked list node values array.
   * @param {SeededPRNG} prng - Deterministic seed instance
   * @param {Object} options - Generator options
   * @param {number} [options.lengthMin=3] - Min node count
   * @param {number} [options.lengthMax=10] - Max node count
   * @param {number} [options.valueMin=1] - Min node value
   * @param {number} [options.valueMax=100] - Max node value
   * @param {boolean} [options.sorted=false] - Whether nodes are sorted
   * @param {string} [options.sortedOrder='asc'] - 'asc' | 'desc'
   * @returns {number[]}
   */
  generate(prng, options = {}) {
    if (!prng) {
      throw new Error("LinkedListPrimitive requires a valid SeededPRNG instance.");
    }

    const {
      lengthMin = 3,
      lengthMax = 10,
      valueMin = 1,
      valueMax = 100,
      sorted = false,
      sortedOrder = 'asc'
    } = options;

    if (lengthMin > lengthMax) {
      throw new Error(`Invalid length range: lengthMin (${lengthMin}) cannot exceed lengthMax (${lengthMax})`);
    }

    const length = prng.nextInt(lengthMin, lengthMax);
    const nodes = [];

    for (let i = 0; i < length; i++) {
      nodes.push(prng.nextInt(valueMin, valueMax));
    }

    if (sorted) {
      nodes.sort((a, b) => sortedOrder === 'desc' ? b - a : a - b);
    }

    return nodes;
  }
}
