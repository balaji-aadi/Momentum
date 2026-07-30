import { BaseGeneratorPlugin } from '../../contracts/GeneratorContracts.js';

/**
 * EncodedStringPlugin - Reusable Generator Plugin for Encoded String / Stack problems (LeetCode 394: Decode String)
 * Generates valid bracket-encoded strings like "3[a]2[bc]", "3[a2[c]]", "2[abc]3[cd]ef"
 */
export class EncodedStringPlugin extends BaseGeneratorPlugin {
  constructor() {
    super('EncodedStringPlugin', 'StringPrimitive');
  }

  /**
   * Generates a valid encoded string input { input: { [paramName]: "3[a2[c]]" } }
   */
  apply(prng, primitiveData, pluginOptions = {}) {
    const {
      maxDepth = 2,
      maxK = 5,
      paramName = 's'
    } = pluginOptions;

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
          // Guarantee at least one encoded bracket segment at root level
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
    if (!s || s.length === 0) s = '3[a]2[bc]';

    return {
      input: { [paramName]: s },
      expectedOutput: null
    };
  }
}
