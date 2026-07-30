import { BaseComparator } from '../contracts/GeneratorContracts.js';

/**
 * RandomListComparator - Deep Isomorphic Comparator for Linked Lists with Random Pointers
 * Validates node value equality and random pointer target index equality for pair arrays [[val, random_idx], ...]
 */
export class RandomListComparator extends BaseComparator {
  constructor() {
    super('RandomListMatch');
  }

  /**
   * Compares actual vs expected random list pair arrays.
   * @param {any} actual - actual output from student code
   * @param {any} expected - expected output from reference solution
   * @returns {{ pass: boolean, match: boolean, actual: string, expected: string, reason?: string }}
   */
  compare(actual, expected) {
    const normActual = this.normalize(actual);
    const normExpected = this.normalize(expected);

    // Both are null or undefined (e.g. empty head = [] -> None)
    if (normActual === null && normExpected === null) {
      return {
        pass: true,
        match: true,
        actual: 'null',
        expected: 'null'
      };
    }

    if (!Array.isArray(normActual) || !Array.isArray(normExpected)) {
      return {
        pass: false,
        match: false,
        actual: JSON.stringify(actual),
        expected: JSON.stringify(expected),
        reason: "Output must be a pair array [[val, random_index], ...] or null"
      };
    }

    if (normActual.length !== normExpected.length) {
      return {
        pass: false,
        match: false,
        actual: JSON.stringify(actual),
        expected: JSON.stringify(expected),
        reason: `List length mismatch: expected ${normExpected.length} nodes, received ${normActual.length} nodes.`
      };
    }

    for (let i = 0; i < normExpected.length; i++) {
      const aPair = normActual[i];
      const ePair = normExpected[i];

      if (!Array.isArray(aPair) || !Array.isArray(ePair) || aPair.length < 2 || ePair.length < 2) {
        return {
          pass: false,
          match: false,
          actual: JSON.stringify(actual),
          expected: JSON.stringify(expected),
          reason: `Invalid node pair structure at index ${i}`
        };
      }

      // 1. Compare node value
      if (aPair[0] !== ePair[0]) {
        return {
          pass: false,
          match: false,
          actual: JSON.stringify(actual),
          expected: JSON.stringify(expected),
          reason: `Node value mismatch at index ${i}: expected ${ePair[0]}, received ${aPair[0]}`
        };
      }

      // 2. Compare random pointer target index
      const aRand = aPair[1] === null || aPair[1] === undefined ? null : Number(aPair[1]);
      const eRand = ePair[1] === null || ePair[1] === undefined ? null : Number(ePair[1]);

      if (aRand !== eRand) {
        return {
          pass: false,
          match: false,
          actual: JSON.stringify(actual),
          expected: JSON.stringify(expected),
          reason: `Random pointer index mismatch at index ${i}: expected ${eRand}, received ${aRand}`
        };
      }
    }

    return {
      pass: true,
      match: true,
      actual: JSON.stringify(normActual),
      expected: JSON.stringify(normExpected)
    };
  }

  normalize(val) {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (e) {
        return val;
      }
    }
    return val;
  }
}
