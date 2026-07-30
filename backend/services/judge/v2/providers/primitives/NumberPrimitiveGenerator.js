import { IGeneratorProvider } from '../../contracts/ProviderContracts.js';

/**
 * NumberPrimitiveGenerator - Generator Provider for Integer and Float Primitives
 */
export class NumberPrimitiveGenerator extends IGeneratorProvider {
  constructor() {
    super('NumberPrimitiveGenerator', '1.0.0');
  }

  supports(ir) {
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();
    const category = ir?.inputSpecification?.structuralSpec?.category;

    if (category === 'PRIMITIVE' && (type === 'number' || type === 'integer' || type === 'float' || type === 'int')) {
      return 0.95;
    }
    return 0.0;
  }

  generate(prng, ir, options = {}) {
    const paramName = options.paramName || 'num';
    const validation = ir?.inputSpecification?.validationSpec || {};
    const minVal = validation.minValue ?? -100;
    const maxVal = validation.maxValue ?? 100;

    const val = prng.nextInt(minVal, maxVal);

    return {
      input: { [paramName]: val },
      expectedOutput: null
    };
  }
}
