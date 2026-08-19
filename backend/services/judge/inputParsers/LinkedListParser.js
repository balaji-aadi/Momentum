import { InputParserError, validateIR } from './IRValidator.js';

/**
 * Linked List Input Parser
 * Produces LinkedListIR: { kind: 'linked_list', nodeType: 'ListNode', values: [...], length: ... }
 */
export class LinkedListParser {
  static parse(val, targetType = 'ListNode', paramName = 'head') {
    if (val === null || val === undefined) {
      return validateIR({
        kind: 'linked_list',
        nodeType: 'ListNode',
        values: [],
        length: 0
      });
    }

    let arrayVal = val;
    if (typeof val === 'string') {
      try {
        arrayVal = JSON.parse(val);
      } catch (e) {
        throw new InputParserError('LinkedListParser', paramName, val, 'JSON Array of values', e.message);
      }
    }

    if (!Array.isArray(arrayVal)) {
      throw new InputParserError('LinkedListParser', paramName, val, 'Array of values e.g. [1, 2, 3]');
    }

    const ir = {
      kind: 'linked_list',
      nodeType: 'ListNode',
      values: arrayVal,
      length: arrayVal.length
    };

    return validateIR(ir);
  }
}
