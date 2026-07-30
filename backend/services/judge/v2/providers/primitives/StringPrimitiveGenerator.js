import { IGeneratorProvider } from '../../contracts/ProviderContracts.js';

/**
 * StringPrimitiveGenerator - Generator Provider for String Primitives
 * Supports Alphabetic, Lowercase, Uppercase, Numeric, Alphanumeric, and Custom Charset
 */
export class StringPrimitiveGenerator extends IGeneratorProvider {
  constructor() {
    super('StringPrimitiveGenerator', '1.0.0');
  }

  supports(ir) {
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();
    const category = ir?.inputSpecification?.structuralSpec?.category;

    if (category === 'PRIMITIVE' && type === 'string' && !ir?.inputSpecification?.structuralSpec?.grammarSpecRef) {
      return 0.95;
    }
    return 0.0;
  }

  generate(prng, ir, options = {}) {
    const paramName = options.paramName || 's';
    const validation = ir?.inputSpecification?.validationSpec || {};
    const minLen = validation.minN ?? 1;
    const maxLen = validation.maxN ?? 20;
    const charsetType = validation.charset || 'lowercase';

    let charPool = 'abcdefghijklmnopqrstuvwxyz';
    if (charsetType === 'uppercase') {
      charPool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    } else if (charsetType === 'alphabetic') {
      charPool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    } else if (charsetType === 'numeric') {
      charPool = '0123456789';
    } else if (charsetType === 'custom' && validation.customCharset) {
      charPool = validation.customCharset;
    }

    const len = prng.nextInt(minLen, maxLen);
    let res = '';
    for (let i = 0; i < len; i++) {
      res += charPool[prng.nextInt(0, charPool.length - 1)];
    }

    return {
      input: { [paramName]: res },
      expectedOutput: null
    };
  }
}
