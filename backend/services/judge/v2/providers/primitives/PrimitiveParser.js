import { IParserProvider } from '../../contracts/ProviderContracts.js';

/**
 * PrimitiveParser - Parser Provider for Primitives, Arrays, and Matrices
 */
export class PrimitiveParser extends IParserProvider {
  constructor() {
    super('PrimitiveParser', '1.0.0');
  }

  supports(ir) {
    const category = ir?.inputSpecification?.structuralSpec?.category;
    if (category === 'PRIMITIVE' || category === 'ARRAY' || category === 'MATRIX') {
      return 0.90;
    }
    return 0.1;
  }

  parse(rawInput) {
    if (typeof rawInput !== 'string') return rawInput;
    try {
      return JSON.parse(rawInput);
    } catch {
      return rawInput;
    }
  }
}
