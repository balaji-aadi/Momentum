import { IComparatorProvider } from '../../contracts/ProviderContracts.js';

/**
 * PrimitiveComparator - Comparator Provider for Primitives, Numbers (with Epsilon), Arrays, & Matrices
 */
export class PrimitiveComparator extends IComparatorProvider {
  constructor() {
    super('PrimitiveComparator', '1.0.0');
  }

  supports(ir) {
    const category = ir?.inputSpecification?.structuralSpec?.category;
    if (category === 'PRIMITIVE' || category === 'ARRAY' || category === 'MATRIX') {
      return 0.90;
    }
    return 0.1;
  }

  compare(actual, expected, options = {}) {
    const { epsilon = 1e-6, unordered = false } = options;

    if (actual === expected) return true;

    // Number Epsilon Floating Point Match
    if (typeof actual === 'number' && typeof expected === 'number') {
      return Math.abs(actual - expected) < epsilon;
    }

    // Array / Matrix Deep JSON & Unordered Match
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) return false;
      if (unordered) {
        const sortedActual = [...actual].sort();
        const sortedExpected = [...expected].sort();
        return JSON.stringify(sortedActual) === JSON.stringify(sortedExpected);
      }
      return JSON.stringify(actual) === JSON.stringify(expected);
    }

    return JSON.stringify(actual) === JSON.stringify(expected);
  }
}
