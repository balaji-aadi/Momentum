import { IGeneratorProvider } from '../../contracts/ProviderContracts.js';

export class EncodedStringGrammarProvider extends IGeneratorProvider {
  constructor() {
    super('EncodedStringGrammarProvider', '1.0.0');
  }

  supports(ir) {
    const grammarRef = (ir?.inputSpecification?.structuralSpec?.grammarSpecRef || '').toLowerCase();
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();
    const validation = ir?.inputSpecification?.validationSpec || {};

    if (grammarRef === 'encodedbracketencoding' || grammarRef === 'decodestring' ||
        (type === 'string' && validation.charset === 'custom' && validation.customCharset?.includes('['))) {
      return 0.98;
    }
    return 0.0;
  }

  generate(prng, ir, options = {}) {
    const paramName = options.paramName || 's';
    const validation = ir?.inputSpecification?.validationSpec || {};
    const maxDepth = validation.maxDepth ?? 2;
    const maxK = validation.maxK ?? 5;
    const letters = 'abcdefghijklmnopqrstuvwxyz';

    const randLetterStr = (minL = 1, maxL = 3) => {
      const len = prng.nextInt(minL, maxL);
      let res = '';
      for (let i = 0; i < len; i++) {
        res += letters[prng.nextInt(0, letters.length - 1)];
      }
      return res;
    };

    const generateSegment = (depth = 0) => {
      const parts = [];
      const segCount = prng.nextInt(1, 3);
      let hasBracket = false;

      for (let i = 0; i < segCount; i++) {
        const choice = prng.nextInt(1, 10);
        if (depth === 0 && i === segCount - 1 && !hasBracket) {
          const k = prng.nextInt(2, Math.max(2, maxK));
          const inner = generateSegment(depth + 1);
          parts.push(`${k}[${inner}]`);
          hasBracket = true;
        } else if (choice <= 4 || depth >= maxDepth) {
          parts.push(randLetterStr(1, 3));
        } else {
          const k = prng.nextInt(2, Math.max(2, maxK));
          const inner = generateSegment(depth + 1);
          parts.push(`${k}[${inner}]`);
          hasBracket = true;
        }
      }
      return parts.join('');
    };

    let s = generateSegment(0);
    if (!s) s = '3[a]2[bc]';

    return {
      input: { [paramName]: s },
      expectedOutput: null
    };
  }
}
