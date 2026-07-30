/**
 * Sarthi Judge v2.0 - Frozen Provider Interfaces & Public Contracts
 * All providers MUST implement their corresponding contract and expose `supports(ir): number`.
 */

export class BaseProvider {
  constructor(id, version = '1.0.0', category = 'GENERAL') {
    if (new.target === BaseProvider) {
      throw new TypeError('Cannot instantiate BaseProvider directly.');
    }
    this.id = id;
    this.version = version;
    this.category = category;
  }

  /**
   * Evaluates how well this provider supports the given InputSpecIR.
   * @param {Object} ir - The InputSpecIR payload
   * @returns {number} Capability score between 0.0 (unsupported) and 1.0 (perfect match)
   */
  supports(ir) {
    return 0.0;
  }
}

export class ISchemaProvider extends BaseProvider {
  constructor(id, version) {
    super(id, version, 'SCHEMA');
  }
  getSchemaDefinition(ir) {
    throw new Error('Method getSchemaDefinition() must be implemented.');
  }
}

export class IGeneratorProvider extends BaseProvider {
  constructor(id, version) {
    super(id, version, 'GENERATOR');
  }
  generate(prng, ir, options = {}) {
    throw new Error('Method generate() must be implemented.');
  }
}

export class IParserProvider extends BaseProvider {
  constructor(id, version) {
    super(id, version, 'PARSER');
  }
  parse(rawInput) {
    throw new Error('Method parse() must be implemented.');
  }
}

export class ISerializerProvider extends BaseProvider {
  constructor(id, version) {
    super(id, version, 'SERIALIZER');
  }
  serialize(parsedObject) {
    throw new Error('Method serialize() must be implemented.');
  }
}

export class IComparatorProvider extends BaseProvider {
  constructor(id, version) {
    super(id, version, 'COMPARATOR');
  }
  compare(actual, expected, options = {}) {
    throw new Error('Method compare() must be implemented.');
  }
}

export class IValidatorProvider extends BaseProvider {
  constructor(id, version) {
    super(id, version, 'VALIDATOR');
  }
  validate(parsedObject, validationSpec) {
    throw new Error('Method validate() must be implemented.');
  }
}

export class IGrammarProvider extends BaseProvider {
  constructor(id, version) {
    super(id, version, 'GRAMMAR');
  }
  getGrammarRules() {
    throw new Error('Method getGrammarRules() must be implemented.');
  }
}
