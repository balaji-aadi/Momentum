import { InputParserError, validateIR } from './IRValidator.js';

/**
 * Binary Tree Input Parser
 * Produces BinaryTreeIR: { kind: 'binary_tree', nodeType: 'TreeNode', bfsOrder: [...], nodeCount: ... }
 */
export class BinaryTreeParser {
  static parse(val, targetType = 'TreeNode', paramName = 'root') {
    if (val === null || val === undefined) {
      return validateIR({
        kind: 'binary_tree',
        nodeType: 'TreeNode',
        bfsOrder: [],
        nodeCount: 0
      });
    }

    let bfsArray = val;
    if (typeof val === 'string') {
      try {
        bfsArray = JSON.parse(val);
      } catch (e) {
        throw new InputParserError('BinaryTreeParser', paramName, val, 'JSON Array e.g. [1, null, 2, 3]', e.message);
      }
    }

    if (!Array.isArray(bfsArray)) {
      throw new InputParserError('BinaryTreeParser', paramName, val, 'Array e.g. [1, null, 2, 3]');
    }

    if (bfsArray.length === 0 || bfsArray[0] === null || bfsArray[0] === undefined) {
      return validateIR({
        kind: 'binary_tree',
        nodeType: 'TreeNode',
        bfsOrder: [],
        nodeCount: 0
      });
    }

    const nodeCount = bfsArray.filter(x => x !== null && x !== undefined).length;

    const ir = {
      kind: 'binary_tree',
      nodeType: 'TreeNode',
      bfsOrder: bfsArray,
      nodeCount
    };

    return validateIR(ir);
  }
}
