import { BaseNormalizer } from '../contracts/GeneratorContracts.js';

/**
 * OutputNormalizers - Pre-Comparison Output Transformation Layer
 * Canonicalizes actual and expected outputs prior to comparator evaluation.
 */
export class OutputNormalizers extends BaseNormalizer {
  /**
   * Sorts inner lists and outer lists for nested arrays (Combination Sum / 3Sum / Subsets).
   * E.g. [[2, 1], [3]] -> [[1, 2], [3]] -> [[1, 2], [3]]
   */
  static sortInnerLists(val) {
    if (!Array.isArray(val)) return val;

    const normalizedInner = val.map(item => {
      if (Array.isArray(item)) {
        return [...item].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      }
      return item;
    });

    // Sort outer list by JSON string representations to guarantee canonical ordering
    return [...normalizedInner].sort((a, b) => {
      const sa = JSON.stringify(a);
      const sb = JSON.stringify(b);
      return sa < sb ? -1 : sa > sb ? 1 : 0;
    });
  }

  /**
   * Truncates floating-point numbers or arrays of floats to epsilon precision (default 1e-5 / 5 decimals).
   */
  static truncateFloat(val, epsilon = 1e-5) {
    if (typeof val === 'number') {
      const decimals = Math.max(0, Math.floor(-Math.log10(epsilon)));
      return Number(val.toFixed(decimals));
    }
    if (Array.isArray(val)) {
      return val.map(item => OutputNormalizers.truncateFloat(item, epsilon));
    }
    if (typeof val === 'object' && val !== null) {
      const res = {};
      for (const key of Object.keys(val)) {
        res[key] = OutputNormalizers.truncateFloat(val[key], epsilon);
      }
      return res;
    }
    return val;
  }

  /**
   * Trims trailing null values from serialized binary tree level-order arrays.
   */
  static canonicalizeTree(val) {
    if (!Array.isArray(val)) return val;
    const res = [...val];
    while (res.length > 0 && res[res.length - 1] === null) {
      res.pop();
    }
    return res;
  }

  /**
   * Sorts graph adjacency lists and neighbor arrays.
   */
  static canonicalizeGraph(val) {
    if (typeof val !== 'object' || val === null) return val;

    if (val.adjacencyList && typeof val.adjacencyList === 'object') {
      const sortedAdj = {};
      const sortedKeys = Object.keys(val.adjacencyList).sort((a, b) => Number(a) - Number(b));
      for (const k of sortedKeys) {
        const neighbors = val.adjacencyList[k];
        if (Array.isArray(neighbors)) {
          sortedAdj[k] = [...neighbors].sort((a, b) => {
            const valA = typeof a === 'object' ? a.node : a;
            const valB = typeof b === 'object' ? b.node : b;
            return valA - valB;
          });
        } else {
          sortedAdj[k] = neighbors;
        }
      }
      return { ...val, adjacencyList: sortedAdj };
    }
    return val;
  }

  /**
   * Main normalizer selector.
   */
  static applyNormalizer(normalizerName, value, options = {}) {
    switch (normalizerName) {
      case 'SortInnerLists':
        return OutputNormalizers.sortInnerLists(value);
      case 'TruncateFloat':
        return OutputNormalizers.truncateFloat(value, options.epsilon || 1e-5);
      case 'CanonicalizeTree':
        return OutputNormalizers.canonicalizeTree(value);
      case 'CanonicalizeGraph':
        return OutputNormalizers.canonicalizeGraph(value);
      default:
        return value;
    }
  }
}
