import { InputParserError, validateIR } from './IRValidator.js';

/**
 * 1D Array Input Parser
 * Produces ArrayIR: { kind: 'array', itemType: 'number'|'string'|'boolean', elements: [...] }
 */
export class ArrayParser {
  static parse(val, targetType = 'number[]', paramName = 'param') {
    if (val === null || val === undefined) {
      const itemType = getItemType(targetType);
      return validateIR({ kind: 'array', itemType, elements: [] });
    }

    let arrayVal = val;
    if (typeof val === 'string') {
      try {
        arrayVal = JSON.parse(val);
      } catch (e) {
        throw new InputParserError('ArrayParser', paramName, val, 'JSON Array', e.message);
      }
    }

    if (!Array.isArray(arrayVal)) {
      throw new InputParserError('ArrayParser', paramName, val, 'Array');
    }

    const itemType = getItemType(targetType);

    // Verify all items match itemType
    for (let i = 0; i < arrayVal.length; i++) {
      const item = arrayVal[i];
      if (itemType === 'number' && (typeof item !== 'number' || isNaN(item))) {
        throw new InputParserError('ArrayParser', `${paramName}[${i}]`, item, 'number');
      } else if (itemType === 'string' && typeof item !== 'string') {
        throw new InputParserError('ArrayParser', `${paramName}[${i}]`, item, 'string');
      } else if (itemType === 'boolean' && typeof item !== 'boolean') {
        throw new InputParserError('ArrayParser', `${paramName}[${i}]`, item, 'boolean');
      }
    }

    const ir = {
      kind: 'array',
      itemType,
      elements: arrayVal
    };

    return validateIR(ir);
  }
}

function getItemType(targetType = 'number[]') {
  const clean = targetType.toLowerCase().trim();
  if (clean.startsWith('string') || clean.includes('str')) return 'string';
  if (clean.startsWith('bool')) return 'boolean';
  return 'number';
}
