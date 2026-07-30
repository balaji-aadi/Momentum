import { IGeneratorProvider, IComparatorProvider } from '../../contracts/ProviderContracts.js';

export class NaryTreeGeneratorProvider extends IGeneratorProvider {
  constructor() {
    super('NaryTreeGeneratorProvider', '1.0.0');
  }

  supports(ir) {
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();
    if (type === 'narytreenode' || type === 'narytree') {
      return 0.98;
    }
    return 0.0;
  }

  generate(prng, ir, options = {}) {
    const paramName = options.paramName || 'root';
    const validation = ir?.inputSpecification?.validationSpec || {};
    const count = prng.nextInt(validation.minN ?? 4, validation.maxN ?? 8);
    const minVal = validation.minValue ?? 1;
    const maxVal = validation.maxValue ?? 50;

    // Generates LeetCode N-ary Tree format: [1, null, 3, 2, 4, null, 5, 6]
    const arr = [prng.nextInt(minVal, maxVal), null];
    for (let i = 1; i < count; i++) {
      arr.push(prng.nextInt(minVal, maxVal));
      if (i % 2 === 0) arr.push(null);
    }

    return {
      input: { [paramName]: arr },
      expectedOutput: null
    };
  }
}

export class NaryTreeComparatorProvider extends IComparatorProvider {
  constructor() {
    super('NaryTreeComparatorProvider', '1.0.0');
  }

  supports(ir) {
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();
    if (type === 'narytreenode' || type === 'narytree') {
      return 0.98;
    }
    return 0.0;
  }

  compare(actual, expected) {
    const toCanonical = (val) => {
      if (Array.isArray(val)) return JSON.stringify(val);
      if (!val) return '[]';

      const res = [];
      const queue = [val];
      while (queue.length > 0) {
        const curr = queue.shift();
        res.push(curr.val);
        if (curr.children && Array.isArray(curr.children)) {
          curr.children.forEach(child => queue.push(child));
        }
      }
      return JSON.stringify(res);
    };

    return toCanonical(actual) === toCanonical(expected);
  }
}
