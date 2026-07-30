/**
 * InputSpecIR - Intermediate Representation (IR) Pipeline Payload
 * Decouples problem definitions from execution and compiler plugins.
 */

export class InputSpecIR {
  constructor({
    irVersion = '4.1.0',
    problemId = '',
    signature = {},
    inputSpecification = null,
    resolvedPlugins = {}
  } = {}) {
    this.irVersion = irVersion;
    this.problemId = problemId;
    this.signature = {
      functionName: signature.functionName || signature.name || 'solve',
      parameters: signature.parameters || [],
      returnType: signature.returnType || 'void'
    };
    this.inputSpecification = inputSpecification;
    this.resolvedPlugins = {
      schemaProviderId: resolvedPlugins.schemaProviderId || null,
      generatorId: resolvedPlugins.generatorId || null,
      parserId: resolvedPlugins.parserId || null,
      serializerId: resolvedPlugins.serializerId || null,
      comparatorId: resolvedPlugins.comparatorId || null,
      validatorId: resolvedPlugins.validatorId || null,
      grammarId: resolvedPlugins.grammarId || null
    };
  }

  toJSON() {
    return {
      irVersion: this.irVersion,
      problemId: this.problemId,
      signature: this.signature,
      inputSpecification: this.inputSpecification ? this.inputSpecification.toJSON() : null,
      resolvedPlugins: this.resolvedPlugins
    };
  }

  static fromJSON(json) {
    if (!json) return null;
    return new InputSpecIR({
      irVersion: json.irVersion,
      problemId: json.problemId,
      signature: json.signature,
      inputSpecification: json.inputSpecification ? InputSpecification.fromJSON(json.inputSpecification) : null,
      resolvedPlugins: json.resolvedPlugins
    });
  }
}
