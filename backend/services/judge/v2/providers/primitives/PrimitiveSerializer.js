import { ISerializerProvider } from '../../contracts/ProviderContracts.js';

/**
 * PrimitiveSerializer - Serializer Provider for Primitives, Arrays, and Matrices
 */
export class PrimitiveSerializer extends ISerializerProvider {
  constructor() {
    super('PrimitiveSerializer', '1.0.0');
  }

  supports(ir) {
    const category = ir?.inputSpecification?.structuralSpec?.category;
    if (category === 'PRIMITIVE' || category === 'ARRAY' || category === 'MATRIX') {
      return 0.90;
    }
    return 0.1;
  }

  serialize(parsedObject) {
    if (typeof parsedObject === 'string') return parsedObject;
    return JSON.stringify(parsedObject);
  }
}
