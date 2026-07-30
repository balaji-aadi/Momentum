import { IGeneratorProvider, IParserProvider, ISerializerProvider, IComparatorProvider } from '../../contracts/ProviderContracts.js';

export class LinkedListGeneratorProvider extends IGeneratorProvider {
  constructor() {
    super('LinkedListGeneratorProvider', '1.0.0');
  }

  supports(ir) {
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();
    const category = ir?.inputSpecification?.structuralSpec?.category;

    if (category === 'LIST' || type === 'listnode' || type === 'linkedlist') {
      return 0.95;
    }
    return 0.0;
  }

  generate(prng, ir, options = {}) {
    const paramName = options.paramName || 'head';
    const validation = ir?.inputSpecification?.validationSpec || {};
    const count = prng.nextInt(validation.minN ?? 3, validation.maxN ?? 8);
    const minVal = validation.minValue ?? 1;
    const maxVal = validation.maxValue ?? 50;

    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(prng.nextInt(minVal, maxVal));
    }

    return {
      input: { [paramName]: arr }, // Serialized array representation [1, 2, 3]
      expectedOutput: null
    };
  }
}

export class LinkedListComparatorProvider extends IComparatorProvider {
  constructor() {
    super('LinkedListComparatorProvider', '1.0.0');
  }

  supports(ir) {
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();
    const category = ir?.inputSpecification?.structuralSpec?.category;
    if (category === 'LIST' || type === 'listnode' || type === 'linkedlist') {
      return 0.95;
    }
    return 0.0;
  }

  compare(actual, expected) {
    const toArr = (val) => {
      if (Array.isArray(val)) return val;
      const res = [];
      let curr = val;
      while (curr) {
        res.push(curr.val !== undefined ? curr.val : curr.value);
        curr = curr.next;
      }
      return res;
    };
    return JSON.stringify(toArr(actual)) === JSON.stringify(toArr(expected));
  }
}
