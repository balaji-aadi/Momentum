import { InputParserError, validateIR } from './IRValidator.js';

/**
 * Primitive Input Parser
 * Produces PrimitiveIR: { kind: 'primitive', type: 'number'|'string'|'boolean', value: ... }
 * Strict: Does NOT silently coerce invalid string values into numbers/booleans.
 */
export class PrimitiveParser {
  static parse(val, targetType = 'number', paramName = 'param') {
    if (val === null || val === undefined) {
      const ir = { kind: 'primitive', type: targetType, value: null };
      return validateIR(ir);
    }

    const cleanType = (targetType || 'number').toLowerCase().trim();

    if (cleanType === 'number' || cleanType === 'int' || cleanType === 'float') {
      if (typeof val !== 'number' || isNaN(val)) {
        throw new InputParserError('PrimitiveParser', paramName, val, 'number');
      }
      const ir = { kind: 'primitive', type: 'number', value: val };
      return validateIR(ir);
    }

    if (cleanType === 'string' || cleanType === 'str') {
      if (typeof val !== 'string') {
        throw new InputParserError('PrimitiveParser', paramName, val, 'string');
      }
      const ir = { kind: 'primitive', type: 'string', value: val };
      return validateIR(ir);
    }

    if (cleanType === 'boolean' || cleanType === 'bool') {
      if (typeof val !== 'boolean') {
        throw new InputParserError('PrimitiveParser', paramName, val, 'boolean');
      }
      const ir = { kind: 'primitive', type: 'boolean', value: val };
      return validateIR(ir);
    }

    throw new InputParserError('PrimitiveParser', paramName, val, `primitive (${cleanType})`);
  }
}
