import { BasePrimitiveGenerator } from '../../contracts/GeneratorContracts.js';

/**
 * MatrixPrimitive - Generic 2D Matrix Primitive Data Generator
 * Generates numeric, binary, or character grids backed by SeededPRNG.
 */
export class MatrixPrimitive extends BasePrimitiveGenerator {
  constructor() {
    super('MatrixPrimitive', 'Matrices');
  }

  /**
   * Generates a 2D matrix.
   * @param {SeededPRNG} prng - Deterministic seed instance
   * @param {Object} options - Generator options
   * @param {number} [options.rowsMin=3] - Min rows
   * @param {number} [options.rowsMax=5] - Max rows
   * @param {number} [options.colsMin=3] - Min cols
   * @param {number} [options.colsMax=5] - Max cols
   * @param {string} [options.cellType='number'] - 'number' | 'binary' | 'char'
   * @param {number} [options.valueMin=-100] - Min element value (numeric)
   * @param {number} [options.valueMax=100] - Max element value (numeric)
   * @param {string} [options.charPool='abcdefghijklmnopqrstuvwxyz'] - Character pool (for 'char' cellType)
   * @returns {any[][]}
   */
  generate(prng, options = {}) {
    if (!prng) {
      throw new Error("MatrixPrimitive requires a valid SeededPRNG instance.");
    }

    const {
      rowsMin = 3,
      rowsMax = 5,
      colsMin = 3,
      colsMax = 5,
      cellType = 'number',
      valueMin = -100,
      valueMax = 100,
      charPool = 'abcdefghijklmnopqrstuvwxyz'
    } = options;

    if (rowsMin > rowsMax) {
      throw new Error(`Invalid row range: rowsMin (${rowsMin}) cannot exceed rowsMax (${rowsMax})`);
    }
    if (colsMin > colsMax) {
      throw new Error(`Invalid col range: colsMin (${colsMin}) cannot exceed colsMax (${colsMax})`);
    }

    const rows = prng.nextInt(rowsMin, rowsMax);
    const cols = prng.nextInt(colsMin, colsMax);
    const matrix = [];

    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        if (cellType === 'binary') {
          row.push(prng.nextInt(0, 1));
        } else if (cellType === 'char') {
          const idx = prng.nextInt(0, charPool.length - 1);
          row.push(charPool[idx]);
        } else {
          row.push(prng.nextInt(valueMin, valueMax));
        }
      }
      matrix.push(row);
    }

    return matrix;
  }
}
