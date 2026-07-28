/**
 * 1D Array Input Parser
 * Parses 1D arrays of numbers, strings, or booleans.
 */

export class ArrayParser {
  static parse(val) {
    if (val === null || val === undefined) return [];

    let arrayVal = val;
    if (typeof val === 'string') {
      try {
        arrayVal = JSON.parse(val);
      } catch (e) {
        throw new Error(`ArrayParser: Unable to parse JSON array string '${val}'`);
      }
    }

    if (!Array.isArray(arrayVal)) {
      throw new Error(`ArrayParser: Expected array, received ${typeof arrayVal}`);
    }

    return arrayVal;
  }
}
