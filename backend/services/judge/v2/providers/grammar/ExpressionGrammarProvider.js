import { IGeneratorProvider } from '../../contracts/ProviderContracts.js';

export class ExpressionGrammarProvider extends IGeneratorProvider {
  constructor() {
    super('ExpressionGrammarProvider', '1.0.0');
  }

  supports(ir) {
    const grammarRef = (ir?.inputSpecification?.structuralSpec?.grammarSpecRef || '').toLowerCase();
    if (grammarRef === 'rpn' || grammarRef === 'calculator' || grammarRef === 'mathexpression') {
      return 0.98;
    }
    return 0.0;
  }

  generate(prng, ir, options = {}) {
    const paramName = options.paramName || 's';
    const grammarRef = (ir?.inputSpecification?.structuralSpec?.grammarSpecRef || '').toLowerCase();

    if (grammarRef === 'rpn') {
      // Generate Reverse Polish Notation Array: ["2", "1", "+", "3", "*"]
      const ops = ['+', '-', '*'];
      const num1 = String(prng.nextInt(1, 10));
      const num2 = String(prng.nextInt(1, 10));
      const op1 = ops[prng.nextInt(0, ops.length - 1)];
      const num3 = String(prng.nextInt(1, 10));
      const op2 = ops[prng.nextInt(0, ops.length - 1)];

      const rpnTokens = [num1, num2, op1, num3, op2];
      return { input: { [paramName]: rpnTokens }, expectedOutput: null };
    }

    // Infix Calculator Math Expression: "(3 + 4) * 2"
    const n1 = prng.nextInt(1, 10);
    const n2 = prng.nextInt(1, 10);
    const n3 = prng.nextInt(1, 5);
    const expr = `(${n1} + ${n2}) * ${n3}`;

    return {
      input: { [paramName]: expr },
      expectedOutput: null
    };
  }
}
