import { BasePrimitiveGenerator } from '../../contracts/GeneratorContracts.js';

/**
 * StringPrimitive - Generic String Primitive Data Generator
 * Generates character sequences backed by SeededPRNG.
 */
export class StringPrimitive extends BasePrimitiveGenerator {
  constructor() {
    super('StringPrimitive', 'Strings');
  }

  /**
   * Predefined character sets for string generation.
   */
  static CHARSETS = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    alphabetic: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numeric: '0123456789',
    alphanumeric: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    hexadecimal: '0123456789abcdef',
    binary: '01'
  };

  /**
   * Generates a character sequence.
   * @param {SeededPRNG} prng - Deterministic seed instance
   * @param {Object} options - Generator options
   * @param {number} [options.lengthMin=5] - Min length
   * @param {number} [options.lengthMax=15] - Max length
   * @param {string} [options.charset='alphabetic'] - Preset name or 'custom'
   * @param {string} [options.customCharset] - Custom character set string
   * @returns {string}
   */
  generate(prng, options = {}) {
    if (!prng) {
      throw new Error("StringPrimitive requires a valid SeededPRNG instance.");
    }

    const {
      lengthMin = 5,
      lengthMax = 15,
      charset = 'alphabetic',
      customCharset = ''
    } = options;

    if (lengthMin > lengthMax) {
      throw new Error(`Invalid length range: lengthMin (${lengthMin}) cannot exceed lengthMax (${lengthMax})`);
    }

    let charPool = StringPrimitive.CHARSETS[charset];
    if (charset === 'custom') {
      charPool = customCharset;
    }

    if (!charPool || charPool.length === 0) {
      charPool = StringPrimitive.CHARSETS.alphabetic;
    }

    const length = prng.nextInt(lengthMin, lengthMax);
    let result = '';
    for (let i = 0; i < length; i++) {
      const charIdx = prng.nextInt(0, charPool.length - 1);
      result += charPool[charIdx];
    }

    return result;
  }
}
