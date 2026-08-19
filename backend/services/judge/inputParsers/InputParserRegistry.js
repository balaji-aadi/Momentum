import { PrimitiveParser } from './PrimitiveParser.js';
import { ArrayParser } from './ArrayParser.js';
import { MatrixParser } from './MatrixParser.js';
import { LinkedListParser } from './LinkedListParser.js';
import { BinaryTreeParser } from './BinaryTreeParser.js';
import { GraphParser } from './GraphParser.js';
import { RandomListParser } from './RandomListParser.js';
import { 
  validateIR, 
  InputParserError, 
  UnsupportedParameterTypeError, 
  IRValidationError 
} from './IRValidator.js';
import { normalizeCanonicalType } from '../../../../shared/templateGenerator.js';

export {
  PrimitiveParser,
  ArrayParser,
  MatrixParser,
  LinkedListParser,
  BinaryTreeParser,
  GraphParser,
  RandomListParser,
  validateIR,
  InputParserError,
  UnsupportedParameterTypeError,
  IRValidationError
};

class InputParserRegistryManager {
  constructor() {
    this.customParsers = new Map();
  }

  /**
   * Extensible Registration for custom DSA structure parsers (e.g. TrieNode, HeapNode).
   */
  register(typeName, parserInstance) {
    if (!typeName || !parserInstance) return;
    this.customParsers.set(typeName.toLowerCase().trim(), parserInstance);
  }

  /**
   * Resolves the appropriate parser for a parameter type.
   * Throws UnsupportedParameterTypeError if unknown. (Zero silent fallbacks).
   */
  getParser(type, paramName = '') {
    if (!type || typeof type !== 'string') {
      throw new UnsupportedParameterTypeError(String(type), paramName);
    }

    const clean = type.trim();
    const lower = clean.toLowerCase();

    // 1. Check custom registered parsers first
    if (this.customParsers.has(lower)) {
      return this.customParsers.get(lower);
    }

    // 2. Resolve built-in canonical types
    const canonical = normalizeCanonicalType(clean);

    switch (canonical) {
      case 'number':
      case 'string':
      case 'boolean':
        return PrimitiveParser;
      case 'number[]':
      case 'string[]':
      case 'boolean[]':
        return ArrayParser;
      case 'number[][]':
      case 'string[][]':
      case 'boolean[][]':
        return MatrixParser;
      case 'ListNode':
        return LinkedListParser;
      case 'RandomListNode':
        return RandomListParser;
      case 'TreeNode':
        return BinaryTreeParser;
      case 'GraphNode':
        return GraphParser;
      default:
        throw new UnsupportedParameterTypeError(clean, paramName);
    }
  }

  /**
   * Parses a single parameter value into validated Language-Neutral IR.
   */
  parseParameter(val, type, paramName = 'param') {
    const parser = this.getParser(type, paramName);
    const ir = parser.parse(val, type, paramName);
    return validateIR(ir);
  }

  /**
   * Parses canonical named-parameter test case input into a map of Language-Neutral IRs.
   * 
   * @param {Object} functionDefinition { functionName, parameters, returnType }
   * @param {Object} testCaseInput { "nums": [2, 7, 11, 15], "target": 9 }
   * @returns {Object} { nums: ArrayIR, target: PrimitiveIR }
   */
  parseTestCase(functionDefinition, testCaseInput) {
    if (!functionDefinition || !Array.isArray(functionDefinition.parameters)) {
      return {};
    }

    let inputObj = testCaseInput;
    if (typeof testCaseInput === 'string') {
      try {
        inputObj = JSON.parse(testCaseInput);
      } catch (e) {
        throw new InputParserError('InputParserRegistry', 'input', testCaseInput, 'JSON Object', e.message);
      }
    }

    if (inputObj === null || inputObj === undefined) {
      inputObj = {};
    }

    const irMap = {};
    const parameters = functionDefinition.parameters;

    // Handle positional array input if passed for backward compatibility
    const isPositional = Array.isArray(inputObj);

    for (let i = 0; i < parameters.length; i++) {
      const param = parameters[i];
      const rawVal = isPositional ? inputObj[i] : inputObj[param.name];

      if (param.required && (rawVal === undefined || rawVal === null) && !param.nullable) {
        throw new InputParserError('InputParserRegistry', param.name, rawVal, `Required ${param.type}`);
      }

      irMap[param.name] = this.parseParameter(rawVal, param.type, param.name);
    }

    return irMap;
  }
}

export const InputParserRegistry = new InputParserRegistryManager();
