import { ExactMatch } from './ExactMatch.js';
import { OrderedArrayMatch } from './OrderedArrayMatch.js';
import { UnorderedArrayMatch } from './UnorderedArrayMatch.js';
import { LinkedListMatch } from './LinkedListMatch.js';
import { TreeMatch } from './TreeMatch.js';
import { GraphMatch } from './GraphMatch.js';
import { FloatToleranceMatch } from './FloatToleranceMatch.js';
import { normalizeExpectedOutput } from './normalizeExpectedOutput.js';
import { 
  UnsupportedComparatorError, 
  createComparisonResult 
} from './ComparatorErrors.js';

export {
  ExactMatch,
  OrderedArrayMatch,
  UnorderedArrayMatch,
  LinkedListMatch,
  TreeMatch,
  GraphMatch,
  FloatToleranceMatch,
  normalizeExpectedOutput,
  UnsupportedComparatorError,
  createComparisonResult
};

export const COMPARATOR_REGISTRY = {
  ExactMatch,
  OrderedArrayMatch,
  UnorderedArrayMatch,
  LinkedListMatch,
  RandomListMatch: LinkedListMatch, // Canonical representation is pair array
  TreeMatch,
  GraphMatch,
  GraphSerializerMatch: GraphMatch,
  FloatToleranceMatch,

  // Aliases for convenience
  exact: ExactMatch,
  ordered: OrderedArrayMatch,
  unordered: UnorderedArrayMatch,
  'linked-list': LinkedListMatch,
  tree: TreeMatch,
  graph: GraphMatch,
  float: FloatToleranceMatch
};

class ComparatorRegistryManager {
  constructor() {
    this.customComparators = new Map();
  }

  /**
   * Extensible Registration for custom comparators.
   */
  register(name, comparatorInstance) {
    if (!name || !comparatorInstance) return;
    this.customComparators.set(name.toLowerCase().trim(), comparatorInstance);
  }

  /**
   * Resolves comparator by name. Throws UnsupportedComparatorError on unknown name.
   */
  getComparator(comparatorName = 'ExactMatch') {
    if (!comparatorName || typeof comparatorName !== 'string') {
      return ExactMatch;
    }

    const clean = comparatorName.trim();
    const lower = clean.toLowerCase();

    if (this.customComparators.has(lower)) {
      return this.customComparators.get(lower);
    }

    if (COMPARATOR_REGISTRY[clean] || COMPARATOR_REGISTRY[lower]) {
      return COMPARATOR_REGISTRY[clean] || COMPARATOR_REGISTRY[lower];
    }

    throw new UnsupportedComparatorError(comparatorName);
  }

  /**
   * Evaluates actual output against expected output using the specified comparator.
   * 
   * @param {any} actualOutput Language-neutral canonical output from Phase 4
   * @param {any} expectedOutput Raw or canonical expected output from test case
   * @param {string} comparatorName Name of comparator (e.g. 'ExactMatch', 'UnorderedArrayMatch')
   * @param {Object} options Options such as depth, epsilon, absTol, relTol
   * @param {string} returnType Declared return type (used for type-aware expected output normalization)
   * @returns {Object} Standardized ComparisonResult
   */
  compare(actualOutput, expectedOutput, comparatorName = 'ExactMatch', options = {}, returnType = '') {
    const comparator = this.getComparator(comparatorName);

    // Type-aware normalization of expected output
    const normExpected = returnType ? normalizeExpectedOutput(expectedOutput, returnType) : expectedOutput;

    return comparator.compare(actualOutput, normExpected, options);
  }

  /**
   * Legacy method support for backward compatibility.
   */
  compareOutput(comparatorName, actualOutput, expectedOutput, options = {}) {
    const comparator = this.getComparator(comparatorName);
    return comparator.compare(actualOutput, expectedOutput, options);
  }
}

export const ComparatorRegistry = new ComparatorRegistryManager();
