import { InputParserError, validateIR } from './IRValidator.js';

/**
 * Random List Input Parser (Linked List with Random Pointers)
 * Produces RandomListIR: {
 *   kind: 'random_list',
 *   nodeType: 'RandomListNode',
 *   nodes: [{ val, nextIndex, randomIndex }, ...],
 *   length: ...
 * }
 */
export class RandomListParser {
  static parse(val, targetType = 'RandomListNode', paramName = 'head') {
    if (val === null || val === undefined) {
      return validateIR({
        kind: 'random_list',
        nodeType: 'RandomListNode',
        nodes: [],
        length: 0
      });
    }

    let pairs = val;
    if (typeof val === 'string') {
      try {
        pairs = JSON.parse(val);
      } catch (e) {
        throw new InputParserError('RandomListParser', paramName, val, 'JSON Array of pairs [[val, random_idx], ...]', e.message);
      }
    }

    if (!Array.isArray(pairs)) {
      throw new InputParserError('RandomListParser', paramName, val, 'Array of pairs [[val, random_idx], ...]');
    }

    if (pairs.length === 0) {
      return validateIR({
        kind: 'random_list',
        nodeType: 'RandomListNode',
        nodes: [],
        length: 0
      });
    }

    const N = pairs.length;
    const nodes = [];

    for (let i = 0; i < N; i++) {
      const pair = pairs[i];
      if (!Array.isArray(pair) || pair.length < 2) {
        throw new InputParserError('RandomListParser', `${paramName}[${i}]`, pair, '[val, randomIndex] pair');
      }

      const nodeVal = pair[0];
      const randomIndex = pair[1] === null || pair[1] === undefined ? null : Number(pair[1]);

      if (randomIndex !== null && (isNaN(randomIndex) || randomIndex < 0 || randomIndex >= N)) {
        throw new InputParserError(
          'RandomListParser',
          `${paramName}[${i}]`,
          pair,
          `randomIndex in range [0, ${N - 1}] or null`,
          `randomIndex ${pair[1]} is out of bounds`
        );
      }

      nodes.push({
        val: nodeVal,
        nextIndex: i < N - 1 ? i + 1 : null,
        randomIndex
      });
    }

    const ir = {
      kind: 'random_list',
      nodeType: 'RandomListNode',
      nodes,
      length: N
    };

    return validateIR(ir);
  }
}
