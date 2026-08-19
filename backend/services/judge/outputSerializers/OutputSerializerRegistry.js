import { PrimitiveSerializer } from './PrimitiveSerializer.js';
import { ArraySerializer } from './ArraySerializer.js';
import { LinkedListSerializer } from './LinkedListSerializer.js';
import { BinaryTreeSerializer } from './BinaryTreeSerializer.js';
import { RandomListSerializer } from './RandomListSerializer.js';
import { GraphNodeSerializer } from './GraphNodeSerializer.js';
import {
  CycleDetectedError,
  ProblemConfigurationError,
  RuntimeSerializationError,
  UnsupportedSerializerTypeError
} from './SerializerErrors.js';
import { normalizeCanonicalType } from '../../../../shared/templateGenerator.js';

export {
  PrimitiveSerializer,
  ArraySerializer,
  LinkedListSerializer,
  BinaryTreeSerializer,
  RandomListSerializer,
  GraphNodeSerializer,
  CycleDetectedError,
  ProblemConfigurationError,
  RuntimeSerializationError,
  UnsupportedSerializerTypeError
};

export const SERIALIZER_REGISTRY = {
  PrimitiveSerializer,
  ArraySerializer,
  MatrixSerializer: ArraySerializer,
  LinkedListSerializer,
  BinaryTreeSerializer,
  RandomListSerializer,
  GraphSerializer: GraphNodeSerializer,
  GraphNodeSerializer,

  // Aliases for convenience
  primitive: PrimitiveSerializer,
  array: ArraySerializer,
  matrix: ArraySerializer,
  'linked-list': LinkedListSerializer,
  'binary-tree': BinaryTreeSerializer,
  'random-list': RandomListSerializer,
  graph: GraphNodeSerializer
};

class OutputSerializerRegistryManager {
  constructor() {
    this.customSerializers = new Map();
  }

  /**
   * Extensible Registration for custom DSA structure serializers (e.g. TrieSerializer, HeapSerializer).
   */
  register(name, serializerInstance) {
    if (!name || !serializerInstance) return;
    this.customSerializers.set(name.toLowerCase().trim(), serializerInstance);
  }

  /**
   * Resolves the serializer for a given DSA type or serializer name.
   */
  getSerializerForType(type) {
    if (!type || typeof type !== 'string') {
      throw new UnsupportedSerializerTypeError(String(type));
    }

    const clean = type.trim();
    const lower = clean.toLowerCase();

    // 1. Custom registered serializers first
    if (this.customSerializers.has(lower)) {
      return this.customSerializers.get(lower);
    }

    // 2. Direct named registry lookup
    if (SERIALIZER_REGISTRY[clean] || SERIALIZER_REGISTRY[lower]) {
      return SERIALIZER_REGISTRY[clean] || SERIALIZER_REGISTRY[lower];
    }

    // 3. Resolve canonical DSA return type
    const canonical = normalizeCanonicalType(clean);
    switch (canonical) {
      case 'number':
      case 'string':
      case 'boolean':
        return PrimitiveSerializer;
      case 'number[]':
      case 'string[]':
      case 'boolean[]':
      case 'number[][]':
      case 'string[][]':
      case 'boolean[][]':
        return ArraySerializer;
      case 'ListNode':
        return LinkedListSerializer;
      case 'RandomListNode':
        return RandomListSerializer;
      case 'TreeNode':
        return BinaryTreeSerializer;
      case 'GraphNode':
        return GraphNodeSerializer;
      default:
        throw new UnsupportedSerializerTypeError(clean);
    }
  }

  /**
   * Directly serializes a raw output value using a designated type or serializer name.
   */
  serialize(rawOutput, type) {
    const serializer = this.getSerializerForType(type);
    return serializer.serialize(rawOutput);
  }

  /**
   * Legacy method support for backward compatibility.
   */
  serializeOutput(serializerName, rawOutput) {
    const serializer = this.getSerializerForType(serializerName);
    return serializer.serialize(rawOutput);
  }

  /**
   * Serializes the execution result according to problem execution profile and function definition.
   * 
   * Strictly distinguishes between:
   * A. Returned-value problems (serializes returnedValue via returnType)
   * B. In-place mutation problems (serializes mutatedParameters[mutatedParameter] via parameter.type)
   * 
   * @param {Object} executionPayload { returnedValue, mutatedParameters }
   * @param {Object} functionDefinition { functionName, parameters, returnType }
   * @param {Object} executionProfile { inPlaceMutation, mutatedParameter }
   * @returns {any} Language-neutral canonical JSON output
   */
  serializeExecutionResult(executionPayload = {}, functionDefinition = {}, executionProfile = {}) {
    const { returnedValue, mutatedParameters = {} } = executionPayload;
    const { returnType = 'void', parameters = [] } = functionDefinition;
    const isInPlace = executionProfile?.inPlaceMutation || returnType === 'void';

    // ==================== CASE A: In-Place Mutation Problems ====================
    if (isInPlace) {
      const mutatedParamName = executionProfile?.mutatedParameter;

      // Strict validation: mutatedParameter MUST be explicitly defined (no silent guessing)
      if (!mutatedParamName || typeof mutatedParamName !== 'string' || !mutatedParamName.trim()) {
        throw new ProblemConfigurationError("In-place mutation problem requires 'executionProfile.mutatedParameter' to be explicitly defined.");
      }

      const cleanParamName = mutatedParamName.trim();
      const paramDef = parameters.find(p => p.name === cleanParamName);

      if (!paramDef) {
        throw new ProblemConfigurationError(`mutatedParameter '${cleanParamName}' not found in functionDefinition parameters.`);
      }

      if (!(cleanParamName in mutatedParameters)) {
        throw new RuntimeSerializationError(`Missing runtime value for mutated parameter '${cleanParamName}'.`);
      }

      const rawMutatedValue = mutatedParameters[cleanParamName];
      const serializer = this.getSerializerForType(paramDef.type);
      return serializer.serialize(rawMutatedValue);
    }

    // ==================== CASE B: Returned-Value Problems ====================
    const serializer = this.getSerializerForType(returnType);
    return serializer.serialize(returnedValue);
  }
}

export const OutputSerializerRegistry = new OutputSerializerRegistryManager();
