import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';
import { SeededPRNG } from '../services/judge/generators/prng/SeededPRNG.js';
import { ArrayPrimitive } from '../services/judge/generators/primitives/ArrayPrimitive.js';
import { GeneratorPluginRegistry } from '../services/judge/generators/registries/GeneratorPluginRegistry.js';

describe('ArrayPrimitive & GeneratorPluginRegistry', () => {
  beforeEach(() => {
    GeneratorPluginRegistry.clearAll();
  });

  test('1. Register and retrieve ArrayPrimitive from generic registry', () => {
    const arrayGen = new ArrayPrimitive();
    GeneratorPluginRegistry.registerPrimitive('ArrayPrimitive', arrayGen);

    const retrieved = GeneratorPluginRegistry.getPrimitive('ArrayPrimitive');
    assert.strictEqual(retrieved, arrayGen);
    assert.strictEqual(GeneratorPluginRegistry.listPrimitives().includes('ArrayPrimitive'), true);
  });

  test('2. Generate 1D array satisfying length and value constraints', () => {
    const prng = new SeededPRNG(12345);
    const arrayGen = new ArrayPrimitive();

    const arr = arrayGen.generate(prng, {
      dimension: 1,
      lengthMin: 10,
      lengthMax: 10,
      valueMin: 50,
      valueMax: 100
    });

    assert.strictEqual(Array.isArray(arr), true);
    assert.strictEqual(arr.length, 10);
    arr.forEach(val => {
      assert.strictEqual(val >= 50 && val <= 100, true);
    });
  });

  test('3. Generate 2D array matrix satisfying row and column constraints', () => {
    const prng = new SeededPRNG(54321);
    const arrayGen = new ArrayPrimitive();

    const matrix = arrayGen.generate(prng, {
      dimension: 2,
      rowsMin: 4,
      rowsMax: 4,
      colsMin: 6,
      colsMax: 6,
      valueMin: 0,
      valueMax: 1
    });

    assert.strictEqual(matrix.length, 4);
    matrix.forEach(row => {
      assert.strictEqual(row.length, 6);
      row.forEach(val => {
        assert.strictEqual(val === 0 || val === 1, true);
      });
    });
  });
});
