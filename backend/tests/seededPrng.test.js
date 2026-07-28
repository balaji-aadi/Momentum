import { describe, test } from 'node:test';
import assert from 'node:assert';
import { SeededPRNG } from '../services/judge/generators/prng/SeededPRNG.js';

describe('SeededPRNG (Mulberry32 PRNG)', () => {
  test('1. Same seed produces identical integer sequences', () => {
    const prng1 = new SeededPRNG(133742);
    const prng2 = new SeededPRNG(133742);

    const seq1 = Array.from({ length: 10 }, () => prng1.nextInt(1, 100));
    const seq2 = Array.from({ length: 10 }, () => prng2.nextInt(1, 100));

    assert.deepStrictEqual(seq1, seq2);
  });

  test('2. Different seeds produce different integer sequences', () => {
    const prng1 = new SeededPRNG(133742);
    const prng2 = new SeededPRNG(999999);

    const seq1 = Array.from({ length: 10 }, () => prng1.nextInt(1, 100));
    const seq2 = Array.from({ length: 10 }, () => prng2.nextInt(1, 100));

    assert.notDeepStrictEqual(seq1, seq2);
  });

  test('3. Resetting PRNG restarts the identical stream', () => {
    const prng = new SeededPRNG(42);
    const seq1 = Array.from({ length: 5 }, () => prng.nextInt(-50, 50));

    prng.reset();
    const seq2 = Array.from({ length: 5 }, () => prng.nextInt(-50, 50));

    assert.deepStrictEqual(seq1, seq2);
  });

  test('4. Range constraints are strictly respected', () => {
    const prng = new SeededPRNG(777);
    for (let i = 0; i < 100; i++) {
      const val = prng.nextInt(-10, 10);
      assert.strictEqual(val >= -10 && val <= 10, true);
    }
  });
});
