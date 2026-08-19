/**
 * Output Serializer Error Definitions (Phase 4)
 */

export class CycleDetectedError extends Error {
  constructor(structureName = 'LinkedList', details = '') {
    super(`[CycleDetectedError] Unexpected cyclic reference detected during ${structureName} serialization. ${details}`.trim());
    this.name = 'CycleDetectedError';
    this.structureName = structureName;
  }
}

export class ProblemConfigurationError extends Error {
  constructor(message) {
    super(`[ProblemConfigurationError] ${message}`);
    this.name = 'ProblemConfigurationError';
  }
}

export class RuntimeSerializationError extends Error {
  constructor(message) {
    super(`[RuntimeSerializationError] ${message}`);
    this.name = 'RuntimeSerializationError';
  }
}

export class UnsupportedSerializerTypeError extends Error {
  constructor(typeName) {
    super(`[UnsupportedSerializerTypeError] No output serializer registered for type '${typeName}'.`);
    this.name = 'UnsupportedSerializerTypeError';
    this.typeName = typeName;
  }
}
