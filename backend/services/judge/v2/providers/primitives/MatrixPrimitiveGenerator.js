import { IGeneratorProvider } from '../../contracts/ProviderContracts.js';

/**
 * MatrixPrimitiveGenerator - Generator Provider for 2D Grids & Matrices (number[][], char[][])
 */
export class MatrixPrimitiveGenerator extends IGeneratorProvider {
  constructor() {
    super('MatrixPrimitiveGenerator', '1.0.0');
  }

  supports(ir) {
    const category = ir?.inputSpecification?.structuralSpec?.category;
    const type = (ir?.inputSpecification?.structuralSpec?.type || '').toLowerCase();

    if (category === 'MATRIX' || type.includes('[][]') || type === 'matrix') {
      return 0.95;
    }
    return 0.0;
  }

  generate(prng, ir, options = {}) {
    const paramName = options.paramName || 'matrix';
    const validation = ir?.inputSpecification?.validationSpec || {};
    const rows = prng.nextInt(validation.minN ?? 3, validation.maxN ?? 6);
    const cols = prng.nextInt(validation.minN ?? 3, validation.maxN ?? 6);
    const minVal = validation.minValue ?? 0;
    const maxVal = validation.maxValue ?? 9;

    const matrix = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push(prng.nextInt(minVal, maxVal));
      }
      matrix.push(row);
    }

    return {
      input: { [paramName]: matrix },
      expectedOutput: null
    };
  }
}
