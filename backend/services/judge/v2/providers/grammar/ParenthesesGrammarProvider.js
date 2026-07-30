import { IGeneratorProvider } from '../../contracts/ProviderContracts.js';

export class ParenthesesGrammarProvider extends IGeneratorProvider {
  constructor() {
    super('ParenthesesGrammarProvider', '1.0.0');
  }

  supports(ir) {
    const grammarRef = (ir?.inputSpecification?.structuralSpec?.grammarSpecRef || '').toLowerCase();
    if (grammarRef === 'parentheses' || grammarRef === 'validparentheses') {
      return 0.98;
    }
    return 0.0;
  }

  generate(prng, ir, options = {}) {
    const paramName = options.paramName || 's';
    const validation = ir?.inputSpecification?.validationSpec || {};
    const pairs = prng.nextInt(validation.minN ?? 2, validation.maxN ?? 6);

    const generateBalanced = (n) => {
      let open = n;
      let close = n;
      let res = '';
      while (open > 0 || close > 0) {
        if (open > 0 && (open === close || prng.nextInt(0, 1) === 0)) {
          res += '(';
          open--;
        } else if (close > open) {
          res += ')';
          close--;
        }
      }
      return res;
    };

    const s = generateBalanced(pairs);
    return {
      input: { [paramName]: s },
      expectedOutput: null
    };
  }
}
