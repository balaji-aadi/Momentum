/**
 * Language-Neutral Intermediate Representation (IR) Validator & Normalizer (Phase 3)
 * 
 * Enforces internal structural consistency and safety guarantees on generated IR objects
 * before they are consumed by downstream language runtime execution adapters.
 */

export class IRValidationError extends Error {
  constructor(message, ir = null) {
    super(`[IRValidationError] ${message}`);
    this.name = 'IRValidationError';
    this.ir = ir;
  }
}

export class InputParserError extends Error {
  constructor(parserName, paramName, invalidValue, expectedFormat, details = '') {
    super(`[${parserName}] Failed to parse parameter '${paramName}': Expected ${expectedFormat}, received ${typeof invalidValue} (${JSON.stringify(invalidValue)}). ${details}`.trim());
    this.name = 'InputParserError';
    this.parserName = parserName;
    this.paramName = paramName;
    this.invalidValue = invalidValue;
    this.expectedFormat = expectedFormat;
  }
}

export class UnsupportedParameterTypeError extends Error {
  constructor(typeName, paramName = '') {
    const prefix = paramName ? ` for parameter '${paramName}'` : '';
    super(`[UnsupportedParameterTypeError] Parameter type '${typeName}'${prefix} is not supported. No parser registered in InputParserRegistry.`);
    this.name = 'UnsupportedParameterTypeError';
    this.typeName = typeName;
    this.paramName = paramName;
  }
}

/**
 * Validates structural invariants of any generated Language-Neutral IR object.
 * Returns normalized IR or throws IRValidationError.
 */
export function validateIR(ir) {
  if (!ir || typeof ir !== 'object') {
    throw new IRValidationError('IR must be a non-null object', ir);
  }

  const { kind } = ir;
  if (!kind || typeof kind !== 'string') {
    throw new IRValidationError("IR object must have a valid 'kind' string field", ir);
  }

  switch (kind) {
    case 'primitive':
      return validatePrimitiveIR(ir);
    case 'array':
      return validateArrayIR(ir);
    case 'matrix':
      return validateMatrixIR(ir);
    case 'linked_list':
      return validateLinkedListIR(ir);
    case 'random_list':
      return validateRandomListIR(ir);
    case 'binary_tree':
      return validateBinaryTreeIR(ir);
    case 'graph_node':
      return validateGraphNodeIR(ir);
    default:
      // Allow custom extensible IR kinds if registered
      if (ir.isCustom) {
        return ir;
      }
      throw new IRValidationError(`Unrecognized IR kind '${kind}'`, ir);
  }
}

function validatePrimitiveIR(ir) {
  const allowedTypes = ['number', 'string', 'boolean'];
  if (!allowedTypes.includes(ir.type)) {
    throw new IRValidationError(`PrimitiveIR 'type' must be one of ${allowedTypes.join(', ')}, received '${ir.type}'`, ir);
  }

  if (ir.value === null || ir.value === undefined) {
    return { ...ir, value: null };
  }

  if (ir.type === 'number') {
    if (typeof ir.value !== 'number' || isNaN(ir.value)) {
      throw new IRValidationError(`PrimitiveIR with type 'number' must have a valid number value, received ${typeof ir.value} (${ir.value})`, ir);
    }
  } else if (ir.type === 'string') {
    if (typeof ir.value !== 'string') {
      throw new IRValidationError(`PrimitiveIR with type 'string' must have a string value, received ${typeof ir.value}`, ir);
    }
  } else if (ir.type === 'boolean') {
    if (typeof ir.value !== 'boolean') {
      throw new IRValidationError(`PrimitiveIR with type 'boolean' must have a boolean value, received ${typeof ir.value}`, ir);
    }
  }

  return ir;
}

function validateArrayIR(ir) {
  if (!Array.isArray(ir.elements)) {
    throw new IRValidationError("ArrayIR 'elements' must be an array", ir);
  }

  const allowedItemTypes = ['number', 'string', 'boolean'];
  if (!allowedItemTypes.includes(ir.itemType)) {
    throw new IRValidationError(`ArrayIR 'itemType' must be one of ${allowedItemTypes.join(', ')}, received '${ir.itemType}'`, ir);
  }

  ir.elements.forEach((item, idx) => {
    if (ir.itemType === 'number' && (typeof item !== 'number' || isNaN(item))) {
      throw new IRValidationError(`ArrayIR element at index ${idx} must be a number, received ${typeof item}`, ir);
    } else if (ir.itemType === 'string' && typeof item !== 'string') {
      throw new IRValidationError(`ArrayIR element at index ${idx} must be a string, received ${typeof item}`, ir);
    } else if (ir.itemType === 'boolean' && typeof item !== 'boolean') {
      throw new IRValidationError(`ArrayIR element at index ${idx} must be a boolean, received ${typeof item}`, ir);
    }
  });

  return ir;
}

function validateMatrixIR(ir) {
  if (!Array.isArray(ir.rows)) {
    throw new IRValidationError("MatrixIR 'rows' must be an array", ir);
  }

  const allowedItemTypes = ['number', 'string', 'boolean'];
  if (!allowedItemTypes.includes(ir.itemType)) {
    throw new IRValidationError(`MatrixIR 'itemType' must be one of ${allowedItemTypes.join(', ')}, received '${ir.itemType}'`, ir);
  }

  const numRows = ir.rows.length;
  if (numRows === 0) {
    return {
      ...ir,
      dimensions: { rows: 0, cols: 0 }
    };
  }

  // Check first row to establish expected column count
  if (!Array.isArray(ir.rows[0])) {
    throw new IRValidationError("MatrixIR row at index 0 must be an array", ir);
  }
  const expectedCols = ir.rows[0].length;

  // Rectangular Matrix Invariant Check: Reject ragged/jagged matrices
  ir.rows.forEach((row, rIdx) => {
    if (!Array.isArray(row)) {
      throw new IRValidationError(`MatrixIR row at index ${rIdx} must be an array`, ir);
    }
    if (row.length !== expectedCols) {
      throw new IRValidationError(`MatrixIR ragged matrix rejected: Row ${rIdx} has length ${row.length}, expected ${expectedCols} for rectangular grid`, ir);
    }
    row.forEach((cell, cIdx) => {
      if (ir.itemType === 'number' && (typeof cell !== 'number' || isNaN(cell))) {
        throw new IRValidationError(`MatrixIR cell at [${rIdx}][${cIdx}] must be a number, received ${typeof cell}`, ir);
      } else if (ir.itemType === 'string' && typeof cell !== 'string') {
        throw new IRValidationError(`MatrixIR cell at [${rIdx}][${cIdx}] must be a string, received ${typeof cell}`, ir);
      } else if (ir.itemType === 'boolean' && typeof cell !== 'boolean') {
        throw new IRValidationError(`MatrixIR cell at [${rIdx}][${cIdx}] must be a boolean, received ${typeof cell}`, ir);
      }
    });
  });

  return {
    ...ir,
    dimensions: { rows: numRows, cols: expectedCols }
  };
}

function validateLinkedListIR(ir) {
  if (ir.nodeType !== 'ListNode') {
    throw new IRValidationError(`LinkedListIR 'nodeType' must be 'ListNode', received '${ir.nodeType}'`, ir);
  }
  if (!Array.isArray(ir.values)) {
    throw new IRValidationError("LinkedListIR 'values' must be an array", ir);
  }

  return {
    ...ir,
    length: ir.values.length
  };
}

function validateRandomListIR(ir) {
  if (ir.nodeType !== 'RandomListNode') {
    throw new IRValidationError(`RandomListIR 'nodeType' must be 'RandomListNode', received '${ir.nodeType}'`, ir);
  }
  if (!Array.isArray(ir.nodes)) {
    throw new IRValidationError("RandomListIR 'nodes' must be an array", ir);
  }

  const N = ir.nodes.length;
  ir.nodes.forEach((node, idx) => {
    if (node.val === undefined || node.val === null) {
      throw new IRValidationError(`RandomListIR node at index ${idx} missing 'val'`, ir);
    }
    if (node.nextIndex !== null && (typeof node.nextIndex !== 'number' || node.nextIndex < 0 || node.nextIndex >= N)) {
      throw new IRValidationError(`RandomListIR node at index ${idx} has invalid 'nextIndex' (${node.nextIndex}) out of bounds [0, ${N - 1}]`, ir);
    }
    if (node.randomIndex !== null && (typeof node.randomIndex !== 'number' || node.randomIndex < 0 || node.randomIndex >= N)) {
      throw new IRValidationError(`RandomListIR node at index ${idx} has invalid 'randomIndex' (${node.randomIndex}) out of bounds [0, ${N - 1}]`, ir);
    }
  });

  return {
    ...ir,
    length: N
  };
}

function validateBinaryTreeIR(ir) {
  if (ir.nodeType !== 'TreeNode') {
    throw new IRValidationError(`BinaryTreeIR 'nodeType' must be 'TreeNode', received '${ir.nodeType}'`, ir);
  }
  if (!Array.isArray(ir.bfsOrder)) {
    throw new IRValidationError("BinaryTreeIR 'bfsOrder' must be an array", ir);
  }

  const nodeCount = ir.bfsOrder.filter(x => x !== null && x !== undefined).length;
  return {
    ...ir,
    nodeCount
  };
}

function validateGraphNodeIR(ir) {
  if (ir.nodeType !== 'GraphNode') {
    throw new IRValidationError(`GraphNodeIR 'nodeType' must be 'GraphNode', received '${ir.nodeType}'`, ir);
  }
  if (!Array.isArray(ir.adjacencyList)) {
    throw new IRValidationError("GraphNodeIR 'adjacencyList' must be an array", ir);
  }

  const V = ir.adjacencyList.length;
  if (V > 0 && (ir.entryNodeVal < 1 || ir.entryNodeVal > V)) {
    throw new IRValidationError(`GraphNodeIR 'entryNodeVal' (${ir.entryNodeVal}) is out of vertex bounds [1, ${V}]`, ir);
  }

  ir.adjacencyList.forEach((neighbors, idx) => {
    if (!Array.isArray(neighbors)) {
      throw new IRValidationError(`GraphNodeIR neighbors for node ${idx + 1} must be an array`, ir);
    }
    neighbors.forEach(nVal => {
      if (typeof nVal !== 'number' || nVal < 1 || nVal > V) {
        throw new IRValidationError(`GraphNodeIR node ${idx + 1} references invalid neighbor vertex index ${nVal} (out of bounds [1, ${V}])`, ir);
      }
    });
  });

  return {
    ...ir,
    vertexCount: V
  };
}
