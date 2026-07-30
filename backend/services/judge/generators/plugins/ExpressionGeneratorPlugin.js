import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';

/**
 * ExpressionGeneratorPlugin - Configurable Expression Tree & Stack Plugin
 * Generates structurally valid arithmetic expression testcases for Postfix (RPN), Prefix, and Infix problems.
 * Configurable operand bounds, operator sets, division guards, negative numbers, and tree depth.
 */
export class ExpressionGeneratorPlugin extends BaseGeneratorPlugin {
  constructor() {
    super('ExpressionGeneratorPlugin', 'StringPrimitive');
  }

  /**
   * Helper to build a random binary expression tree recursively.
   */
  generateTree(prng, depth, options) {
    const {
      maxDepth = 3,
      operandMin = -200,
      operandMax = 200,
      operators = ['+', '-', '*', '/'],
      allowNegativeNumbers = true,
      allowDivision = true,
      allowDivisionByZero = false,
      ensureIntegerDivision = true
    } = options;

    const minVal = allowNegativeNumbers ? operandMin : Math.max(0, operandMin);

    const randomNonZeroOperand = () => {
      let v = prng.nextInt(minVal, operandMax);
      if (v === 0) v = prng.nextFloat() < 0.5 ? 1 : -1;
      return { type: 'operand', val: v, result: v, strVal: String(v) };
    };

    // Stop recursion at maxDepth or with probability after depth 1
    if (depth >= maxDepth || (depth >= 1 && prng.nextFloat() < 0.35)) {
      let val = prng.nextInt(minVal, operandMax);
      return { type: 'operand', val, result: val, strVal: String(val) };
    }

    // Filter available operators
    let validOps = [...operators];
    if (!allowDivision) {
      validOps = validOps.filter(op => op !== '/');
    }
    if (validOps.length === 0) validOps = ['+'];

    let op = validOps[prng.nextInt(0, validOps.length - 1)];

    let left = this.generateTree(prng, depth + 1, options);
    let right = this.generateTree(prng, depth + 1, options);

    // Prevent division by zero: if right evaluates to 0, replace right with non-zero operand
    if (op === '/' && !allowDivisionByZero) {
      if (right.result === 0) {
        right = randomNonZeroOperand();
      }
    }

    // Integer division handling: adjust operand if left is an operand
    if (op === '/' && ensureIntegerDivision && right.result !== 0) {
      if (left.type === 'operand') {
        const factor = prng.nextInt(1, 10);
        left.result = right.result * factor;
        left.val = left.result;
        left.strVal = String(left.result);
      }
    }

    let nodeResult = 0;
    if (op === '+') {
      nodeResult = left.result + right.result;
    } else if (op === '-') {
      nodeResult = left.result - right.result;
    } else if (op === '*') {
      nodeResult = left.result * right.result;
    } else if (op === '/') {
      const denom = (!allowDivisionByZero && right.result === 0) ? 1 : right.result;
      nodeResult = denom !== 0 ? Math.trunc(left.result / denom) : 0;
    }

    return {
      type: 'operator',
      op,
      left,
      right,
      result: nodeResult
    };
  }

  /**
   * Serialize tree to Postfix (Reverse Polish Notation): Left -> Right -> Root
   */
  toPostfix(node) {
    if (node.type === 'operand') return [node.strVal];
    return [...this.toPostfix(node.left), ...this.toPostfix(node.right), node.op];
  }

  /**
   * Serialize tree to Prefix (Polish Notation): Root -> Left -> Right
   */
  toPrefix(node) {
    if (node.type === 'operand') return [node.strVal];
    return [node.op, ...this.toPrefix(node.left), ...this.toPrefix(node.right)];
  }

  /**
   * Serialize tree to Infix (Parenthesized): Left Op Right
   */
  toInfix(node, isRoot = true) {
    if (node.type === 'operand') return [node.strVal];
    const leftPart = this.toInfix(node.left, false);
    const rightPart = this.toInfix(node.right, false);
    const combined = [...leftPart, node.op, ...rightPart];
    return isRoot ? combined : ['(', ...combined, ')'];
  }

  /**
   * Generates formatted expression input object.
   * @param {SeededPRNG} prng
   * @param {any} primitiveData
   * @param {Object} pluginOptions
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    const options = {
      mode: pluginOptions.mode || 'postfix',
      outputType: pluginOptions.outputType || 'array',
      operandMin: pluginOptions.minValue !== undefined ? pluginOptions.minValue : (pluginOptions.operandMin ?? -200),
      operandMax: pluginOptions.maxValue !== undefined ? pluginOptions.maxValue : (pluginOptions.operandMax ?? 200),
      operators: pluginOptions.operators || ['+', '-', '*', '/'],
      maxDepth: pluginOptions.maxDepth || 3,
      allowNegativeNumbers: pluginOptions.allowNegativeNumbers !== undefined ? pluginOptions.allowNegativeNumbers : true,
      allowDivision: pluginOptions.allowDivision !== undefined ? pluginOptions.allowDivision : true,
      allowDivisionByZero: pluginOptions.allowDivisionByZero !== undefined ? pluginOptions.allowDivisionByZero : false,
      ensureIntegerDivision: pluginOptions.ensureIntegerDivision !== undefined ? pluginOptions.ensureIntegerDivision : true,
      paramName: pluginOptions.paramName || 'tokens'
    };

    const tree = this.generateTree(prng, 0, options);
    let tokenArray = [];

    if (options.mode === 'prefix') {
      tokenArray = this.toPrefix(tree);
    } else if (options.mode === 'infix') {
      tokenArray = this.toInfix(tree);
    } else {
      // Default: postfix (RPN)
      tokenArray = this.toPostfix(tree);
    }

    const finalOutput = options.outputType === 'string'
      ? tokenArray.join(options.mode === 'infix' ? '' : ' ')
      : tokenArray;

    return {
      input: { [options.paramName]: finalOutput },
      expectedOutput: null
    };
  }
}
