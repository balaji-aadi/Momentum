import { IGeneratorProvider, IComparatorProvider } from '../../contracts/ProviderContracts.js';

export class RandomListGeneratorProvider extends IGeneratorProvider {
  constructor() {
    super('RandomListGeneratorProvider', '1.0.0');
  }

  supports(ir) {
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();
    if (type === 'randomlistnode' || type === 'randomlist') {
      return 0.98;
    }
    return 0.0;
  }

  generate(prng, ir, options = {}) {
    const paramName = options.paramName || 'head';
    const validation = ir?.inputSpecification?.validationSpec || {};
    const count = prng.nextInt(validation.minN ?? 4, validation.maxN ?? 8);
    const minVal = validation.minValue ?? -100;
    const maxVal = validation.maxValue ?? 100;

    const listPairs = [];
    for (let i = 0; i < count; i++) {
      const val = prng.nextInt(minVal, maxVal);
      const randIdx = prng.nextInt(0, 10) > 3 ? prng.nextInt(0, count - 1) : null;
      listPairs.push([val, randIdx]);
    }

    return {
      input: { [paramName]: listPairs },
      expectedOutput: null
    };
  }
}

export class RandomListComparatorProvider extends IComparatorProvider {
  constructor() {
    super('RandomListComparatorProvider', '1.0.0');
  }

  supports(ir) {
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();
    if (type === 'randomlistnode' || type === 'randomlist') {
      return 0.98;
    }
    return 0.0;
  }

  compare(actual, expected, options = {}) {
    // Normalizes [[val, random_index], ...] array or Node graph
    const toCanonical = (val) => {
      if (Array.isArray(val)) return JSON.stringify(val);
      if (!val) return 'null';

      const nodes = [];
      const nodeToIdx = new Map();
      let curr = val;

      while (curr) {
        nodeToIdx.set(curr, nodes.length);
        nodes.push(curr);
        curr = curr.next;
      }

      const pairs = nodes.map(n => [
        n.val,
        n.random ? nodeToIdx.get(n.random) ?? null : null
      ]);
      return JSON.stringify(pairs);
    };

    const actualCanon = toCanonical(actual);
    const expectedCanon = toCanonical(expected);

    // Deep-copy identity check if original node graph passed
    if (options.originalHead && actual && typeof actual === 'object') {
      let orig = options.originalHead;
      let cloned = actual;
      while (orig && cloned) {
        if (orig === cloned) {
          return false; // Rejected: Returned original node instead of deep copy!
        }
        orig = orig.next;
        cloned = cloned.next;
      }
    }

    return actualCanon === expectedCanon;
  }
}
