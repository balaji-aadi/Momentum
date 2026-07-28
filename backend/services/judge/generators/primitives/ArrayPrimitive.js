import { BasePrimitiveGenerator } from '../../contracts/GeneratorContracts.js';

/**
 * ArrayPrimitive - Generic 1D / 2D Array Primitive Data Generator
 * Generates raw numeric arrays backed by SeededPRNG.
 */
export class ArrayPrimitive extends BasePrimitiveGenerator {
  constructor() {
    super('ArrayPrimitive', 'Arrays');
  }

  /**
   * Generates a 1D or 2D numeric array.
   * @param {SeededPRNG} prng - Deterministic seed instance
   * @param {Object} options - Generator options
   * @param {number} [options.dimension=1] - 1 for 1D array, 2 for 2D matrix
   * @param {number} [options.lengthMin=5] - Min length for 1D array
   * @param {number} [options.lengthMax=15] - Max length for 1D array
   * @param {number} [options.rowsMin=3] - Min rows for 2D array
   * @param {number} [options.rowsMax=5] - Max rows for 2D array
   * @param {number} [options.colsMin=3] - Min cols for 2D array
   * @param {number} [options.colsMax=5] - Max cols for 2D array
   * @param {number} [options.valueMin=-100] - Min element value
   * @param {number} [options.valueMax=100] - Max element value
   * @returns {number[] | number[][]}
   */
  generate(prng, options = {}) {
    if (!prng) {
      throw new Error("ArrayPrimitive requires a valid SeededPRNG instance.");
    }

    const {
      dimension = 1,
      lengthMin = 5,
      lengthMax = 15,
      rowsMin = 3,
      rowsMax = 5,
      colsMin = 3,
      colsMax = 5,
      valueMin = -100,
      valueMax = 100
    } = options;

    if (valueMin > valueMax) {
      throw new Error(`Invalid constraints: valueMin (${valueMin}) cannot exceed valueMax (${valueMax})`);
    }

    if (dimension === 2) {
      const rows = prng.nextInt(rowsMin, rowsMax);
      const cols = prng.nextInt(colsMin, colsMax);
      const matrix = [];
      for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
          row.push(prng.nextInt(valueMin, valueMax));
        }
        matrix.push(row);
      }
      return matrix;
    }

    // Default 1D Array
    const length = prng.nextInt(lengthMin, lengthMax);
    const array = [];
    for (let i = 0; i < length; i++) {
      array.push(prng.nextInt(valueMin, valueMax));
    }
    return array;
  }
}
