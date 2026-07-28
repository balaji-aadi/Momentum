/**
 * Pre-flight Test Case Validator for Universal Execution Engine
 * Validates testcase JSON inputs against problem parameter definitions prior to database persistence.
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
  } else if (cleanType === 'string') {
    if (typeof val !== 'string') {
      throw new Error(`Parameter '${paramName}' must be a string, received ${typeof val} (${JSON.stringify(val)})`);
    }
  } else if (cleanType === 'boolean' || cleanType === 'bool') {
    if (typeof val !== 'boolean') {
      throw new Error(`Parameter '${paramName}' must be a boolean, received ${typeof val} (${JSON.stringify(val)})`);
    }
  } else if (cleanType === 'number[]' || cleanType === 'int[]' || cleanType === 'list[int]') {
    if (!Array.isArray(val)) {
      throw new Error(`Parameter '${paramName}' must be an array of numbers, received ${typeof val}`);
    }
    val.forEach((item, idx) => {
      if (typeof item !== 'number' || isNaN(item)) {
        throw new Error(`Element at index ${idx} of parameter '${paramName}' must be a number`);
      }
    });
  } else if (cleanType === 'string[]' || cleanType === 'list[str]') {
    if (!Array.isArray(val)) {
      throw new Error(`Parameter '${paramName}' must be an array of strings, received ${typeof val}`);
    }
    val.forEach((item, idx) => {
      if (typeof item !== 'string') {
        throw new Error(`Element at index ${idx} of parameter '${paramName}' must be a string`);
      }
    });
  } else if (cleanType === 'number[][]' || cleanType === 'int[][]' || cleanType === 'matrix') {
    if (!Array.isArray(val)) {
      throw new Error(`Parameter '${paramName}' must be a 2D matrix array, received ${typeof val}`);
    }
    val.forEach((row, idx) => {
      if (!Array.isArray(row)) {
        throw new Error(`Row ${idx} of parameter '${paramName}' must be an array`);
      }
    });
  } else if (cleanType === 'listnode' || cleanType === 'treenode') {
    if (!Array.isArray(val) && typeof val !== 'object' && val !== null) {
      throw new Error(`Parameter '${paramName}' (${type}) must be an array, object representation, or null`);
    }
  }
}

export function validateProblemTestCases(functionDefinition, visibleTestCases = [], hiddenTestCases = []) {
  if (!functionDefinition || !Array.isArray(functionDefinition.parameters) || functionDefinition.parameters.length === 0) {
    return; // Legacy string problems without declared parameters bypass schema type checking
  }

  const parameters = functionDefinition.parameters;
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
        // String input format (e.g. "nums = [2,7,11,15], target = 9")
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
  }
}
