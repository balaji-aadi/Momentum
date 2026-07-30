import { IGeneratorProvider } from '../../contracts/ProviderContracts.js';

/**
 * ArrayPrimitiveGenerator - Generator Provider for 1D Primitive Arrays (number[], string[])
 */
export class ArrayPrimitiveGenerator extends IGeneratorProvider {
  constructor() {
    super('ArrayPrimitiveGenerator', '1.0.0');
  }

  supports(ir) {
    const category = ir?.inputSpecification?.structuralSpec?.category;
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();

    if (category === 'ARRAY' || type.endsWith('[]')) {
      return 0.90;
    }
    return 0.0;
  }

  generate(prng, ir, options = {}) {
    const paramName = options.paramName || 'arr';
    const validation = ir?.inputSpecification?.validationSpec || {};
    const size = prng.nextInt(validation.minN ?? 5, validation.maxN ?? 15);
    const minVal = validation.minValue ?? -100;
    const maxVal = validation.maxValue ?? 100;

    const arr = [];
    for (let i = 0; i < size; i++) {
      arr.push(prng.nextInt(minVal, maxVal));
    }

    return {
      input: { [paramName]: arr },
      expectedOutput: null
    };
  }
}
