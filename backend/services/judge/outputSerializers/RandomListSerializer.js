/**
 * RandomListSerializer - Serializer for Linked Lists with Random Pointers
 * Serializes node objects or node arrays into 2D pair arrays [[val, random_index], ...]
 */
export class RandomListSerializer {
  static serialize(rawOutput) {
    if (rawOutput === null || rawOutput === undefined) return null;
    let data = rawOutput;

    if (typeof rawOutput === 'string') {
      try {
        data = JSON.parse(rawOutput);
      } catch (e) {
        return rawOutput;
      }
    }

    if (Array.isArray(data)) return data;

    // Traverses heap object if rawOutput is a Node object with .next and .random
    const nodes = [];
    const nodeToIndexMap = new Map();
    let curr = data;
    let idx = 0;

    while (curr && typeof curr === 'object') {
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
