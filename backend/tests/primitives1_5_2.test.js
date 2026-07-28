import { describe, test, before } from 'node:test';
import assert from 'node:assert';
import { SeededPRNG } from '../services/judge/generators/prng/SeededPRNG.js';
import { StringPrimitive } from '../services/judge/generators/primitives/StringPrimitive.js';
import { MatrixPrimitive } from '../services/judge/generators/primitives/MatrixPrimitive.js';
import { LinkedListPrimitive } from '../services/judge/generators/primitives/LinkedListPrimitive.js';
import { GeneratorPluginRegistry } from '../services/judge/generators/registries/GeneratorPluginRegistry.js';

describe('Phase 1.5.2 Primitives: String, Matrix, LinkedList', () => {
  let stringGen, matrixGen, listGen;

  before(() => {
    stringGen = new StringPrimitive();
    matrixGen = new MatrixPrimitive();
    listGen = new LinkedListPrimitive();

    GeneratorPluginRegistry.registerPrimitive('StringPrimitive', stringGen);
    GeneratorPluginRegistry.registerPrimitive('MatrixPrimitive', matrixGen);
    GeneratorPluginRegistry.registerPrimitive('LinkedListPrimitive', listGen);
  });

  describe('1. StringPrimitive Unit Tests', () => {
    test('Length and alphabetic preset validation', () => {
      const prng = new SeededPRNG(1111);
      const str = stringGen.generate(prng, { lengthMin: 12, lengthMax: 12, charset: 'alphabetic' });

      assert.strictEqual(typeof str, 'string');
      assert.strictEqual(str.length, 12);
      assert.strictEqual(/^[a-zA-Z]+$/.test(str), true);
    });

    test('Numeric & custom charset presets', () => {
      const prng = new SeededPRNG(2222);
      const numStr = stringGen.generate(prng, { lengthMin: 10, lengthMax: 10, charset: 'numeric' });
      assert.strictEqual(/^[0-9]+$/.test(numStr), true);

      const customStr = stringGen.generate(prng, { lengthMin: 8, lengthMax: 8, charset: 'custom', customCharset: 'SARTHI' });
      assert.strictEqual(/^[SARTHI]+$/.test(customStr), true);
    });

    test('Seeded PRNG reproducibility for strings', () => {
      const prngA = new SeededPRNG(133742);
      const prngB = new SeededPRNG(133742);

      const strA = stringGen.generate(prngA, { lengthMin: 20, lengthMax: 20 });
      const strB = stringGen.generate(prngB, { lengthMin: 20, lengthMax: 20 });

      assert.strictEqual(strA, strB);
    });
  });

  describe('2. MatrixPrimitive Unit Tests', () => {
    test('Row, column, and numeric value bounds validation', () => {
      const prng = new SeededPRNG(3333);
      const mat = matrixGen.generate(prng, {
        rowsMin: 4, rowsMax: 4,
        colsMin: 6, colsMax: 6,
        valueMin: -10, valueMax: 10
      });

      assert.strictEqual(mat.length, 4);
      mat.forEach(row => {
        assert.strictEqual(row.length, 6);
        row.forEach(val => {
          assert.strictEqual(val >= -10 && val <= 10, true);
        });
      });
    });

    test('Binary cellType validation (0 or 1 only)', () => {
      const prng = new SeededPRNG(4444);
      const binaryMat = matrixGen.generate(prng, {
        rowsMin: 5, rowsMax: 5,
        colsMin: 5, colsMax: 5,
        cellType: 'binary'
      });

      binaryMat.forEach(row => {
        row.forEach(val => {
          assert.strictEqual(val === 0 || val === 1, true);
        });
      });
    });
  });

  describe('3. LinkedListPrimitive Unit Tests', () => {
    test('Node array length and value bounds validation', () => {
      const prng = new SeededPRNG(5555);
      const nodes = listGen.generate(prng, { lengthMin: 8, lengthMax: 8, valueMin: 10, valueMax: 50 });

      assert.strictEqual(nodes.length, 8);
      nodes.forEach(val => {
        assert.strictEqual(val >= 10 && val <= 50, true);
      });
    });

    test('Sorted option validation (ascending and descending)', () => {
      const prng = new SeededPRNG(6666);
      const ascNodes = listGen.generate(prng, { lengthMin: 10, lengthMax: 10, sorted: true, sortedOrder: 'asc' });
      for (let i = 1; i < ascNodes.length; i++) {
        assert.strictEqual(ascNodes[i] >= ascNodes[i - 1], true);
      }

      const descNodes = listGen.generate(prng, { lengthMin: 10, lengthMax: 10, sorted: true, sortedOrder: 'desc' });
      for (let i = 1; i < descNodes.length; i++) {
        assert.strictEqual(descNodes[i] <= descNodes[i - 1], true);
      }
    });
  });

  describe('4. Generic Registry Integration Test', () => {
    test('Retrieve and generate all Phase 1.5.2 primitives from GeneratorPluginRegistry', () => {
      const prng = new SeededPRNG(7777);

      const strInst = GeneratorPluginRegistry.getPrimitive('StringPrimitive');
      const matInst = GeneratorPluginRegistry.getPrimitive('MatrixPrimitive');
      const listInst = GeneratorPluginRegistry.getPrimitive('LinkedListPrimitive');

      assert.notStrictEqual(strInst, null);
      assert.notStrictEqual(matInst, null);
      assert.notStrictEqual(listInst, null);

      const resStr = strInst.generate(prng);
      const resMat = matInst.generate(prng);
      const resList = listInst.generate(prng);

      assert.strictEqual(typeof resStr, 'string');
      assert.strictEqual(Array.isArray(resMat), true);
      assert.strictEqual(Array.isArray(resList), true);
    });
  });
});
