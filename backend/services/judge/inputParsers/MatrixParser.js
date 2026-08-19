import { InputParserError, validateIR } from './IRValidator.js';

/**
 * 2D Matrix Input Parser
 * Produces MatrixIR: { kind: 'matrix', itemType: 'number'|'string'|'boolean', rows: [...], dimensions: { rows, cols } }
 * Enforces rectangular grid constraints; handles [] and [[]].
 */
export class MatrixParser {
  static parse(val, targetType = 'number[][]', paramName = 'param') {
    if (val === null || val === undefined) {
      const itemType = getItemType(targetType);
      return validateIR({
        kind: 'matrix',
        itemType,
        rows: [],
        dimensions: { rows: 0, cols: 0 }
      });
    }

    let matrixVal = val;
    if (typeof val === 'string') {
      try {
        matrixVal = JSON.parse(val);
      } catch (e) {
        throw new InputParserError('MatrixParser', paramName, val, 'JSON 2D Array', e.message);
      }
    }

    if (!Array.isArray(matrixVal)) {
      throw new InputParserError('MatrixParser', paramName, val, '2D Matrix Array');
    }

    const itemType = getItemType(targetType);

    if (matrixVal.length === 0) {
      return validateIR({
        kind: 'matrix',
        itemType,
        rows: [],
        dimensions: { rows: 0, cols: 0 }
      });
    }

    // Verify all rows are arrays and validate rectangular dimensions
    const expectedCols = Array.isArray(matrixVal[0]) ? matrixVal[0].length : null;

    for (let r = 0; r < matrixVal.length; r++) {
      const row = matrixVal[r];
      if (!Array.isArray(row)) {
        throw new InputParserError('MatrixParser', `${paramName}[${r}]`, row, 'Array row');
      }

      if (row.length !== expectedCols) {
        throw new InputParserError(
          'MatrixParser',
          `${paramName}[${r}]`,
          row,
          `Rectangular row with ${expectedCols} columns`,
          `Row ${r} has ${row.length} columns (ragged matrix rejected)`
        );
      }

      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (itemType === 'number' && (typeof cell !== 'number' || isNaN(cell))) {
          throw new InputParserError('MatrixParser', `${paramName}[${r}][${c}]`, cell, 'number');
        } else if (itemType === 'string' && typeof cell !== 'string') {
          throw new InputParserError('MatrixParser', `${paramName}[${r}][${c}]`, cell, 'string');
        } else if (itemType === 'boolean' && typeof cell !== 'boolean') {
          throw new InputParserError('MatrixParser', `${paramName}[${r}][${c}]`, cell, 'boolean');
        }
      }
    }

    const ir = {
      kind: 'matrix',
      itemType,
      rows: matrixVal,
      dimensions: {
        rows: matrixVal.length,
        cols: expectedCols
      }
    };

    return validateIR(ir);
  }
}

function getItemType(targetType = 'number[][]') {
  const clean = targetType.toLowerCase().trim();
  if (clean.includes('string') || clean.includes('str')) return 'string';
  if (clean.includes('bool')) return 'boolean';
  return 'number';
}
