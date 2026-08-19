/**
 * Problem Validator & Compatibility Engine (Phase 1)
 * 
 * Enforces:
 * 1. Parameter Type -> Parser Mapping Contract
 * 2. Return Type -> Output Serializer Compatibility Contract
 * 3. Serializer / Return Type -> Comparator Compatibility Contract
 * 4. Structured Parameter-based Test Case Input & Output Validation
 */

// 1. Parameter Type to Parser Contract Mapping
export const DATA_TYPE_PARSER_MAP = {
  // Primitives
  'number': 'PrimitiveParser',
  'int': 'PrimitiveParser',
  'float': 'PrimitiveParser',
  'string': 'PrimitiveParser',
  'str': 'PrimitiveParser',
  'boolean': 'PrimitiveParser',
  'bool': 'PrimitiveParser',

  // 1D Arrays
  'number[]': 'ArrayParser',
  'int[]': 'ArrayParser',
  'float[]': 'ArrayParser',
  'list[int]': 'ArrayParser',
  'list[float]': 'ArrayParser',
  'string[]': 'ArrayParser',
  'list[str]': 'ArrayParser',
  'list[string]': 'ArrayParser',
  'boolean[]': 'ArrayParser',
  'bool[]': 'ArrayParser',
  'list[bool]': 'ArrayParser',

  // 2D Matrices
  'number[][]': 'MatrixParser',
  'int[][]': 'MatrixParser',
  'float[][]': 'MatrixParser',
  'matrix': 'MatrixParser',
  'list[list[int]]': 'MatrixParser',
  'string[][]': 'MatrixParser',
  'boolean[][]': 'MatrixParser',

  // Complex / Linked Data Structures
  'listnode': 'LinkedListParser',
  'linkedlist': 'LinkedListParser',
  'randomlistnode': 'RandomListParser',
  'treenode': 'BinaryTreeParser',
  'binarytree': 'BinaryTreeParser',
  'graph': 'GraphParser',
  'graphnode': 'GraphParser',
  'graph_node': 'GraphParser'
};

// 2. Return Type to Allowed Output Serializers Mapping
export const RETURN_TYPE_SERIALIZER_MAP = {
  'number': ['PrimitiveSerializer'],
  'int': ['PrimitiveSerializer'],
  'float': ['PrimitiveSerializer'],
  'string': ['PrimitiveSerializer'],
  'str': ['PrimitiveSerializer'],
  'boolean': ['PrimitiveSerializer'],
  'bool': ['PrimitiveSerializer'],

  'number[]': ['ArraySerializer'],
  'int[]': ['ArraySerializer'],
  'float[]': ['ArraySerializer'],
  'list[int]': ['ArraySerializer'],
  'string[]': ['ArraySerializer'],
  'list[str]': ['ArraySerializer'],
  'boolean[]': ['ArraySerializer'],
  'bool[]': ['ArraySerializer'],

  'number[][]': ['ArraySerializer', 'MatrixSerializer'],
  'int[][]': ['ArraySerializer', 'MatrixSerializer'],
  'matrix': ['ArraySerializer', 'MatrixSerializer'],
  'string[][]': ['ArraySerializer', 'MatrixSerializer'],
  'boolean[][]': ['ArraySerializer', 'MatrixSerializer'],

  'listnode': ['LinkedListSerializer'],
  'linkedlist': ['LinkedListSerializer'],
  'randomlistnode': ['RandomListSerializer', 'ArraySerializer'],
  'treenode': ['BinaryTreeSerializer'],
  'binarytree': ['BinaryTreeSerializer'],
  'graph': ['ArraySerializer', 'GraphSerializer', 'GraphNodeSerializer'],
  'graphnode': ['ArraySerializer', 'GraphSerializer', 'GraphNodeSerializer'],
  'graph_node': ['ArraySerializer', 'GraphSerializer', 'GraphNodeSerializer'],
  'void': ['PrimitiveSerializer', 'ArraySerializer', 'MatrixSerializer', 'LinkedListSerializer', 'RandomListSerializer', 'BinaryTreeSerializer']
};

// 3. Output Serializer to Allowed Comparators Mapping
export const SERIALIZER_COMPARATOR_MAP = {
  'PrimitiveSerializer': ['ExactMatch', 'FloatToleranceMatch'],
  'ArraySerializer': ['ExactMatch', 'OrderedArrayMatch', 'UnorderedArrayMatch'],
  'MatrixSerializer': ['ExactMatch', 'OrderedArrayMatch', 'UnorderedArrayMatch'],
  'LinkedListSerializer': ['LinkedListMatch'],
  'RandomListSerializer': ['RandomListMatch', 'ExactMatch'],
  'BinaryTreeSerializer': ['TreeMatch'],
  'GraphSerializer': ['GraphMatch', 'ExactMatch', 'UnorderedArrayMatch'],
  'GraphNodeSerializer': ['GraphMatch', 'ExactMatch', 'UnorderedArrayMatch']
};

/**
 * Validates cross-field compatibility between Function Definition and Execution Profile.
 * Throws an Error if an incompatible parser, serializer, or comparator configuration is detected.
 */
export function validateExecutionProfileCompatibility(functionDefinition, executionProfile) {
  if (!executionProfile) {
    return;
  }

  // Enforce FUNCTION runtime
  if (executionProfile.runtimeType && executionProfile.runtimeType !== 'FUNCTION') {
    throw new Error(`Execution Profile Error: Only 'FUNCTION' runtimeType is supported in current phase. Received: '${executionProfile.runtimeType}'`);
  }

  const parameters = functionDefinition?.parameters || [];
  const returnType = (functionDefinition?.returnType || 'void').trim();
  const cleanReturnType = returnType.toLowerCase();

  // 1. Verify every parameter type maps to a registered parser
  for (const param of parameters) {
    const cleanType = (param.type || '').trim().toLowerCase();
    const mappedParser = DATA_TYPE_PARSER_MAP[cleanType];

    if (!mappedParser) {
      throw new Error(`Execution Profile Error: Parameter '${param.name}' has unsupported or unregistered type '${param.type}'.`);
    }
  }

  // 2. Verify Return Type -> Serializer Compatibility
  const outputSerializer = executionProfile.outputSerializer || 'PrimitiveSerializer';
  let effectiveReturnType = cleanReturnType;

  // Handle in-place mutation (e.g. void return type modifying an input parameter)
  if (cleanReturnType === 'void' && executionProfile.inPlaceMutation) {
    if (!executionProfile.mutatedParameter) {
      throw new Error(`Execution Profile Error: 'inPlaceMutation' is enabled, but 'mutatedParameter' name is not specified.`);
    }

    const mutatedParam = parameters.find(p => p.name === executionProfile.mutatedParameter);
    if (!mutatedParam) {
      throw new Error(`Execution Profile Error: Mutated parameter '${executionProfile.mutatedParameter}' does not exist in function parameters.`);
    }

    effectiveReturnType = (mutatedParam.type || '').trim().toLowerCase();
  }

  const allowedSerializers = RETURN_TYPE_SERIALIZER_MAP[effectiveReturnType];
  if (allowedSerializers && !allowedSerializers.includes(outputSerializer)) {
    throw new Error(
      `Execution Profile Error: Output Serializer '${outputSerializer}' is incompatible with return type '${returnType}'. Expected one of: ${allowedSerializers.join(', ')}`
    );
  }

  // 3. Verify Serializer -> Comparator Compatibility
  const comparator = executionProfile.comparator || 'ExactMatch';
  const allowedComparators = SERIALIZER_COMPARATOR_MAP[outputSerializer];

  if (allowedComparators && !allowedComparators.includes(comparator)) {
    throw new Error(
      `Execution Profile Error: Comparator '${comparator}' is incompatible with output serializer '${outputSerializer}'. Expected one of: ${allowedComparators.join(', ')}`
    );
  }

  // 4. Special Return Type & Comparator checks
  if (comparator === 'FloatToleranceMatch' && cleanReturnType !== 'number' && cleanReturnType !== 'float') {
    throw new Error(`Execution Profile Error: 'FloatToleranceMatch' comparator is only valid for float/number return types. Received: '${returnType}'`);
  }
}

/**
 * Validates a single input value against its declared parameter type.
 */
export function validateSingleInput(val, type, paramName) {
  if (val === undefined || val === null) {
    return;
  }

  const cleanType = (type || '').toLowerCase().trim();

  if (cleanType === 'number' || cleanType === 'int' || cleanType === 'float') {
    if (typeof val !== 'number' || isNaN(val)) {
      throw new Error(`Parameter '${paramName}' must be a valid number, received ${typeof val} (${JSON.stringify(val)})`);
    }
  } else if (cleanType === 'string' || cleanType === 'str') {
    if (typeof val !== 'string') {
      throw new Error(`Parameter '${paramName}' must be a string, received ${typeof val} (${JSON.stringify(val)})`);
    }
  } else if (cleanType === 'boolean' || cleanType === 'bool') {
    if (typeof val !== 'boolean') {
      throw new Error(`Parameter '${paramName}' must be a boolean, received ${typeof val} (${JSON.stringify(val)})`);
    }
  } else if (cleanType === 'number[]' || cleanType === 'int[]' || cleanType === 'float[]' || cleanType === 'list[int]' || cleanType === 'list[float]') {
    if (!Array.isArray(val)) {
      throw new Error(`Parameter '${paramName}' must be an array of numbers, received ${typeof val}`);
    }
    val.forEach((item, idx) => {
      if (typeof item !== 'number' || isNaN(item)) {
        throw new Error(`Element at index ${idx} of parameter '${paramName}' must be a number`);
      }
    });
  } else if (cleanType === 'string[]' || cleanType === 'list[str]' || cleanType === 'list[string]') {
    if (!Array.isArray(val)) {
      throw new Error(`Parameter '${paramName}' must be an array of strings, received ${typeof val}`);
    }
    val.forEach((item, idx) => {
      if (typeof item !== 'string') {
        throw new Error(`Element at index ${idx} of parameter '${paramName}' must be a string`);
      }
    });
  } else if (cleanType === 'boolean[]' || cleanType === 'bool[]' || cleanType === 'list[bool]') {
    if (!Array.isArray(val)) {
      throw new Error(`Parameter '${paramName}' must be an array of booleans, received ${typeof val}`);
    }
    val.forEach((item, idx) => {
      if (typeof item !== 'boolean') {
        throw new Error(`Element at index ${idx} of parameter '${paramName}' must be a boolean`);
      }
    });
  } else if (cleanType === 'number[][]' || cleanType === 'int[][]' || cleanType === 'float[][]' || cleanType === 'matrix' || cleanType === 'list[list[int]]') {
    if (!Array.isArray(val)) {
      throw new Error(`Parameter '${paramName}' must be a 2D matrix array, received ${typeof val}`);
    }
    val.forEach((row, rIdx) => {
      if (!Array.isArray(row)) {
        throw new Error(`Row ${rIdx} of parameter '${paramName}' must be an array`);
      }
      row.forEach((item, cIdx) => {
        if (typeof item !== 'number' || isNaN(item)) {
          throw new Error(`Element at [${rIdx}][${cIdx}] of parameter '${paramName}' must be a number`);
        }
      });
    });
  } else if (cleanType === 'string[][]') {
    if (!Array.isArray(val)) {
      throw new Error(`Parameter '${paramName}' must be a 2D matrix of strings, received ${typeof val}`);
    }
    val.forEach((row, rIdx) => {
      if (!Array.isArray(row)) {
        throw new Error(`Row ${rIdx} of parameter '${paramName}' must be an array`);
      }
      row.forEach((item, cIdx) => {
        if (typeof item !== 'string') {
          throw new Error(`Element at [${rIdx}][${cIdx}] of parameter '${paramName}' must be a string`);
        }
      });
    });
  } else if (cleanType === 'listnode' || cleanType === 'linkedlist') {
    if (!Array.isArray(val) && typeof val !== 'object' && val !== null) {
      throw new Error(`Parameter '${paramName}' (ListNode) must be an array of node values e.g. [1,2,3] or null, received ${typeof val}`);
    }
  } else if (cleanType === 'randomlistnode') {
    if (!Array.isArray(val) && typeof val !== 'object' && val !== null) {
      throw new Error(`Parameter '${paramName}' (RandomListNode) must be a 2D array of [val, random_index] pairs e.g. [[7,null],[13,0]] or null`);
    }
  } else if (cleanType === 'treenode' || cleanType === 'binarytree') {
    if (!Array.isArray(val) && typeof val !== 'object' && val !== null) {
      throw new Error(`Parameter '${paramName}' (TreeNode) must be a level-order array e.g. [1,null,2,3] or null, received ${typeof val}`);
    }
  } else if (cleanType === 'graph') {
    if (!Array.isArray(val) && typeof val !== 'object' && val !== null) {
      throw new Error(`Parameter '${paramName}' (Graph) must be an adjacency list e.g. [[2,4],[1,3]] or null`);
    }
  }
}

/**
 * Validates a single expected output value against the declared return type.
 */
export function validateSingleOutput(val, returnType) {
  if (val === undefined || val === null) {
    return;
  }

  const cleanType = (returnType || '').toLowerCase().trim();
  if (cleanType === 'void') {
    return;
  }

  try {
    validateSingleInput(val, returnType, 'expectedOutput');
  } catch (err) {
    throw new Error(`Expected Output mismatch: ${err.message}`);
  }
}

/**
 * Validates all visible and hidden test cases against the function definition schema.
 */
export function validateProblemTestCases(functionDefinition, visibleTestCases = [], hiddenTestCases = []) {
  if (!functionDefinition || !Array.isArray(functionDefinition.parameters) || functionDefinition.parameters.length === 0) {
    return; // Problems without declared parameters bypass schema type checking
  }

  const parameters = functionDefinition.parameters;
  const returnType = functionDefinition.returnType || 'void';

  const allTestCases = [
    ...visibleTestCases.map((tc, i) => ({ ...tc, tcType: 'Visible', index: i + 1 })),
    ...hiddenTestCases.map((tc, i) => ({ ...tc, tcType: 'Hidden', index: i + 1 }))
  ];

  for (const tc of allTestCases) {
    let inputObj = tc.input;

    // If input is stored as JSON string, attempt to parse
    if (typeof inputObj === 'string') {
      try {
        inputObj = JSON.parse(inputObj);
      } catch (e) {
        // Raw string or non-JSON input format
        continue;
      }
    }

    if (typeof inputObj !== 'object' || inputObj === null) {
      continue;
    }

    // Validate parameters against input JSON object
    for (const param of parameters) {
      const val = inputObj[param.name];

      if (param.required && (val === undefined || val === null) && !param.nullable) {
        throw new Error(`${tc.tcType} Testcase #${tc.index} is missing required parameter '${param.name}'`);
      }

      if (val !== undefined && val !== null) {
        validateSingleInput(val, param.type, param.name);
      }
    }

    // Validate expected output if specified
    if (tc.expectedOutput !== undefined && tc.expectedOutput !== null && tc.expectedOutput !== '') {
      let outputVal = tc.expectedOutput;
      if (typeof outputVal === 'string') {
        try {
          outputVal = JSON.parse(outputVal);
        } catch (e) {
          // keep as string
        }
      }
      validateSingleOutput(outputVal, returnType);
    }
  }
}

/**
 * Validates manual starter code overrides against the single source of truth (Function Definition).
 * Rejects overrides that violate the declared function name or required parameter names.
 */
export function validateStarterCodeOverrides(starterCode = [], functionDefinition) {
  if (!Array.isArray(starterCode) || starterCode.length === 0 || !functionDefinition) {
    return;
  }

  const fnName = functionDefinition.functionName || 'solution';
  const parameters = functionDefinition.parameters || [];

  for (const item of starterCode) {
    if (!item || !item.code || typeof item.code !== 'string') continue;
    const code = item.code;
    const lang = item.language || 'unknown';

    // 1. Must contain declared function name
    if (!code.includes(fnName)) {
      throw new Error(`Starter Code Override Error for '${lang}': Code template does not contain declared function name '${fnName}'.`);
    }

    // 2. Must contain all declared parameter names
    for (const param of parameters) {
      if (!code.includes(param.name)) {
        throw new Error(`Starter Code Override Error for '${lang}': Code template is missing required parameter '${param.name}'.`);
      }
    }
  }
}

