import { ExactMatch } from './ExactMatch.js';
import { OrderedArrayMatch } from './OrderedArrayMatch.js';
import { UnorderedArrayMatch } from './UnorderedArrayMatch.js';
import { UnorderedNestedArrayMatch } from './UnorderedNestedArrayMatch.js';
import { LinkedListMatch } from './LinkedListMatch.js';
import { TreeMatch } from './TreeMatch.js';
import { FloatToleranceMatch } from './FloatToleranceMatch.js';
import { RandomListComparator } from './RandomListComparator.js';

export const COMPARATOR_REGISTRY = {
  ExactMatch,
  OrderedArrayMatch,
  UnorderedArrayMatch,
  UnorderedNestedArrayMatch,
  LinkedListMatch,
  TreeMatch,
  FloatToleranceMatch,
  RandomListMatch: new RandomListComparator()
};

export class ComparatorRegistry {
  static normalizeValue(val) {
    if (val === null || val === undefined) return val;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (
        (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        trimmed === 'true' ||
        trimmed === 'false' ||
        (!isNaN(trimmed) && trimmed !== '')
      ) {
        try {
          return JSON.parse(trimmed);
        } catch (e) {
          return val;
        }
      }
    }
    return val;
  }

  static compareOutput(comparatorName, actualOutput, expectedOutput, options = {}) {
    const normActual = ComparatorRegistry.normalizeValue(actualOutput);
    const normExpected = ComparatorRegistry.normalizeValue(expectedOutput);

    let comparator = COMPARATOR_REGISTRY[comparatorName];

    if (!comparator) {
      if (Array.isArray(normExpected)) {
        comparator = OrderedArrayMatch;
      } else {
        comparator = ExactMatch;
      }
    }

    return comparator.compare(normActual, normExpected, options);
  }
}
