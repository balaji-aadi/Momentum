/**
 * InputSpecification - Frontend Mirror for Sarthi Judge v2.0
 */
export class InputSpecification {
  constructor({
    schemaVersion = '4.1.0',
    structuralSpec = {},
    validationSpec = {}
  } = {}) {
    this.schemaVersion = schemaVersion;
    this.structuralSpec = {
      category: structuralSpec.category || 'PRIMITIVE',
      type: structuralSpec.type || 'string',
      nodeSchema: structuralSpec.nodeSchema || null,
      grammarSpecRef: structuralSpec.grammarSpecRef || null
    };
    this.validationSpec = {
      minN: validationSpec.minN ?? 1,
      maxN: validationSpec.maxN ?? 30,
      minValue: validationSpec.minValue ?? -100,
      maxValue: validationSpec.maxValue ?? 100,
      charset: validationSpec.charset || 'alphabetic',
      customCharset: validationSpec.customCharset || null,
      maxK: validationSpec.maxK ?? 300,
      maxDepth: validationSpec.maxDepth ?? 3
    };
  }

  toJSON() {
    return {
      schemaVersion: this.schemaVersion,
      structuralSpec: this.structuralSpec,
      validationSpec: this.validationSpec
    };
  }

  static fromJSON(json) {
    if (!json || typeof json !== 'object') {
      throw new Error('Invalid InputSpecification JSON payload.');
    }
    return new InputSpecification({
      schemaVersion: json.schemaVersion || '4.1.0',
      structuralSpec: json.structuralSpec || {},
      validationSpec: json.validationSpec || {}
    });
  }
}
