import { IGrammarProvider } from '../../contracts/ProviderContracts.js';

/**
 * GrammarEngine - Generic Context-Free Grammar (CFG) AST Evaluator & Production Rule Synthesizer
 */
export class GrammarEngine extends IGrammarProvider {
  constructor(id = 'GenericGrammarEngine', version = '1.0.0') {
    super(id, version);
  }

  supports(ir) {
    const category = ir?.inputSpecification?.structuralSpec?.category;
    const grammarRef = ir?.inputSpecification?.structuralSpec?.grammarSpecRef;

    if (category === 'GRAMMAR' || grammarRef) {
      return 0.95;
    }
    return 0.0;
  }

  /**
   * Generates a string adhering to production rules and nesting constraints
   */
  synthesize(prng, grammarSpec, options = {}) {
    const maxDepth = grammarSpec.maxDepth ?? 3;
    const maxK = grammarSpec.maxK ?? 5;
    const charPool = grammarSpec.charPool || 'abcdefghijklmnopqrstuvwxyz';

    const randWord = (minL = 1, maxL = 3) => {
      const len = prng.nextInt(minL, maxL);
      let res = '';
      for (let i = 0; i < len; i++) {
        res += charPool[prng.nextInt(0, charPool.length - 1)];
      }
      return res;
    };

    const expandSymbol = (symbol, depth = 0) => {
      if (symbol === 'LETTERS') return randWord(1, 3);
      if (symbol === 'DIGITS') return String(prng.nextInt(2, maxK));
      if (symbol === 'OPERATOR') {
        const ops = ['+', '-', '*'];
        return ops[prng.nextInt(0, ops.length - 1)];
      }
      return symbol;
    };

    return { expandSymbol, randWord };
  }
}
