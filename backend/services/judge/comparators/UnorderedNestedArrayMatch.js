import { BaseComparator } from '../contracts/GeneratorContracts.js';
import { OutputNormalizers } from '../normalizers/OutputNormalizers.js';

/**
 * UnorderedNestedArrayMatch - Extended Multiset Sub-array Comparator
 * Evaluates nested 2D/3D array outputs ignoring inner element order and outer list order.
 * Essential for Combination Sum, 3Sum, Subsets, and Group Anagrams.
 */
export class UnorderedNestedArrayMatch extends BaseComparator {
  static compare(actual, expected, options = {}) {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      if (actual === expected || JSON.stringify(actual) === JSON.stringify(expected)) {
        return { match: true };
      }
      return { match: false, diff: `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.` };
    }

    const normActual = OutputNormalizers.sortInnerLists(actual);
    const normExpected = OutputNormalizers.sortInnerLists(expected);

    const strActual = JSON.stringify(normActual);
    const strExpected = JSON.stringify(normExpected);

    if (strActual === strExpected) {
      return { match: true };
    }

    return {
      match: false,
      diff: `Unordered nested mismatch. Expected ${strExpected}, got ${strActual}.`
    };
  }

  compare(actual, expected, options = {}) {
    return UnorderedNestedArrayMatch.compare(actual, expected, options);
  }
}
