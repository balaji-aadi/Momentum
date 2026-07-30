import { IValidatorProvider } from '../../contracts/ProviderContracts.js';

/**
 * PrimitiveValidator - Validator Provider verifying inputs satisfy ValidationSpecification
 */
export class PrimitiveValidator extends IValidatorProvider {
  constructor() {
    super('PrimitiveValidator', '1.0.0');
  }

  supports(ir) {
    const category = ir?.inputSpecification?.structuralSpec?.category;
    if (category === 'PRIMITIVE' || category === 'ARRAY' || category === 'MATRIX') {
      return 0.90;
    }
    return 0.1;
  }

  validate(val, validationSpec = {}) {
    if (val === null || val === undefined) return false;

    // Number Range Validation
    if (typeof val === 'number') {
      if (validationSpec.minValue !== undefined && val < validationSpec.minValue) return false;
      if (validationSpec.maxValue !== undefined && val > validationSpec.maxValue) return false;
      return true;
    }

    // String Length Validation
    if (typeof val === 'string') {
      if (validationSpec.minN !== undefined && val.length < validationSpec.minN) return false;
      if (validationSpec.maxN !== undefined && val.length > validationSpec.maxN) return false;
      return true;
    }

    // Array / Matrix Size Validation
    if (Array.isArray(val)) {
      if (validationSpec.minN !== undefined && val.length < validationSpec.minN) return false;
      if (validationSpec.maxN !== undefined && val.length > validationSpec.maxN) return false;
      return true;
    }

    return true;
  }
}
