/**
 * 2D Matrix Input Parser
 * Parses 2D grid arrays.
 */

export class MatrixParser {
  static parse(val) {
    if (val === null || val === undefined) return [];

    let matrixVal = val;
    if (typeof val === 'string') {
      try {
        matrixVal = JSON.parse(val);
      } catch (e) {
        throw new Error(`MatrixParser: Unable to parse JSON matrix string '${val}'`);
      }
    }

    if (!Array.isArray(matrixVal)) {
      throw new Error(`MatrixParser: Expected 2D array matrix, received ${typeof matrixVal}`);
    }

    matrixVal.forEach((row, i) => {
      if (!Array.isArray(row)) {
        throw new Error(`MatrixParser: Row ${i} is not an array`);
      }
    });

    return matrixVal;
  }
}
