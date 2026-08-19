import { CycleDetectedError } from './SerializerErrors.js';

/**
 * Random List Output Serializer (Phase 4)
 * Serializes `RandomListNode` chain into canonical 2D pair array `[[val, random_index], ...]`.
 * Enforces strict CycleDetectedError on unexpected cycles during linear .next traversal.
 */
export class RandomListSerializer {
  static serialize(rawOutput) {
    if (rawOutput === null || rawOutput === undefined) return [];

    let data = rawOutput;
    if (typeof rawOutput === 'string') {
      try {
        data = JSON.parse(rawOutput);
      } catch (e) {
        return [];
      }
    }

    if (Array.isArray(data)) return data;

    // Two-pass serialization from Node object graph
    const nodes = [];
    const nodeToIndexMap = new Map();
    const visited = new Set();
    let curr = data;
    let idx = 0;
    const MAX_STEPS = 100000;

    while (curr && typeof curr === 'object') {
      if (visited.has(curr) || idx > MAX_STEPS) {
        throw new CycleDetectedError('RandomListNode', `Cycle encountered on .next pointer at node with val '${curr?.val}'`);
      }
      visited.add(curr);

      nodes.push(curr);
      nodeToIndexMap.set(curr, idx);
      curr = curr.next;
      idx++;
    }

    return nodes.map(node => {
      const val = node.val;
      const randIdx = node.random && nodeToIndexMap.has(node.random)
        ? nodeToIndexMap.get(node.random)
        : null;
      return [val, randIdx];
    });
  }
}
