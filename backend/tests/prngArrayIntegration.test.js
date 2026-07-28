import { describe, test, before } from 'node:test';
import assert from 'node:assert';
import { SeededPRNG } from '../services/judge/generators/prng/SeededPRNG.js';
import { ArrayPrimitive } from '../services/judge/generators/primitives/ArrayPrimitive.js';
import { GeneratorPluginRegistry } from '../services/judge/generators/registries/GeneratorPluginRegistry.js';

describe('Integration Test: SeededPRNG -> ArrayPrimitive -> Generate Array', () => {
  let generator;

  before(() => {
    generator = new ArrayPrimitive();
    GeneratorPluginRegistry.registerPrimitive('ArrayPrimitive', generator);
  });

  test('1. Same seed (133742) ALWAYS produces identical 1D & 2D arrays', () => {
    const prngA = new SeededPRNG(133742);
    const prngB = new SeededPRNG(133742);

    const opts1D = { dimension: 1, lengthMin: 15, lengthMax: 15, valueMin: -500, valueMax: 500 };
    const arrayA_1D = generator.generate(prngA, opts1D);
    const arrayB_1D = generator.generate(prngB, opts1D);

    assert.deepStrictEqual(arrayA_1D, arrayB_1D);

    const opts2D = { dimension: 2, rowsMin: 5, rowsMax: 5, colsMin: 5, colsMax: 5, valueMin: 0, valueMax: 99 };
    const matrixA_2D = generator.generate(prngA, opts2D);
    const matrixB_2D = generator.generate(prngB, opts2D);

    assert.deepStrictEqual(matrixA_2D, matrixB_2D);
  });

  test('2. Different seeds produce different array datasets', () => {
    const prngA = new SeededPRNG(133742);
    const prngC = new SeededPRNG(987654);

    const opts = { dimension: 1, lengthMin: 20, lengthMax: 20, valueMin: 1, valueMax: 1000 };
    const arrayA = generator.generate(prngA, opts);
    const arrayC = generator.generate(prngC, opts);

    assert.notDeepStrictEqual(arrayA, arrayC);
  });

  test('3. Generated arrays strictly satisfy all requested length and value constraints', () => {
    const prng = new SeededPRNG(88888);
    const constraints = {
      dimension: 1,
      lengthMin: 25,
      lengthMax: 50,
      valueMin: -1000,
      valueMax: 1000
    };

    for (let trial = 0; trial < 10; trial++) {
      const generated = generator.generate(prng, constraints);

      assert.strictEqual(generated.length >= constraints.lengthMin, true);
      assert.strictEqual(generated.length <= constraints.lengthMax, true);

      generated.forEach(val => {
        assert.strictEqual(val >= constraints.valueMin, true);
        assert.strictEqual(val <= constraints.valueMax, true);
        assert.strictEqual(Number.isInteger(val), true);
      });
    }
  });
});
