import { describe, test } from 'node:test';
import assert from 'node:assert';
import { SeededPRNG } from '../services/judge/generators/prng/SeededPRNG.js';
import { StressGenerators } from '../services/judge/generators/stress/StressGenerators.js';

describe('Phase 1.5.7 Stress Generator Layer (Complexity Limits)', () => {
  test('1. generateMaxArrayStress produces max length array with stress metadata', () => {
    const prng = new SeededPRNG(1001);
    const res = StressGenerators.generateMaxArrayStress(prng, { maxN: 500 });

    assert.strictEqual(res.isStress, true);
    assert.strictEqual(res.category, 'MaxArray');
    assert.strictEqual(res.input.nums.length, 500);
  });

  test('2. generateDeepSkewedTreeStress produces deep skewed tree structure', () => {
    const prng = new SeededPRNG(2002);
    // Test N <= 15 level-order array format
    const resSmall = StressGenerators.generateDeepSkewedTreeStress(prng, { nodeCount: 10, direction: 'right' });
    assert.strictEqual(resSmall.isStress, true);
    assert.strictEqual(Array.isArray(resSmall.input.root), true);

    // Test N > 15 deep tree object format
    const resDeep = StressGenerators.generateDeepSkewedTreeStress(prng, { nodeCount: 100, direction: 'right' });
    assert.strictEqual(resDeep.isStress, true);
    assert.strictEqual(resDeep.category, 'DeepTree');
    assert.strictEqual(typeof resDeep.input.root, 'object');
    assert.strictEqual(resDeep.input.root.val !== undefined, true);
  });

  test('3. generateDenseGraphStress produces dense edge list matching requested maxV and maxE bounds', () => {
    const prng = new SeededPRNG(3003);
    const res = StressGenerators.generateDenseGraphStress(prng, { maxV: 50, maxE: 200 });

    assert.strictEqual(res.isStress, true);
    assert.strictEqual(res.category, 'DenseGraph');
    assert.strictEqual(res.input.n, 50);
    assert.strictEqual(res.input.edges.length, 200);
  });

  test('4. generateWorstCaseTwoSumStress places target pair at the last two array indices', () => {
    const prng = new SeededPRNG(4004);
    const maxN = 300;
    const res = StressGenerators.generateWorstCaseTwoSumStress(prng, { maxN });

    assert.strictEqual(res.isStress, true);
    assert.strictEqual(res.category, 'WorstCaseTwoSum');
    const { nums, target } = res.input;

    assert.strictEqual(nums.length, maxN);
    assert.strictEqual(nums[maxN - 2] + nums[maxN - 1], target);
  });

  test('5. generateWorstCaseDPStress returns candidates array and target total', () => {
    const prng = new SeededPRNG(5005);
    const res = StressGenerators.generateWorstCaseDPStress(prng, { count: 30, targetTotal: 5000 });

    assert.strictEqual(res.isStress, true);
    assert.strictEqual(res.category, 'WorstCaseDP');
    assert.strictEqual(res.input.candidates.length, 30);
    assert.strictEqual(res.input.target, 5000);
  });

  test('6. SeededPRNG reproducibility for StressGenerators', () => {
    const prngA = new SeededPRNG(133742);
    const prngB = new SeededPRNG(133742);

    const stressA = StressGenerators.generateWorstCaseTwoSumStress(prngA, { maxN: 100 });
    const stressB = StressGenerators.generateWorstCaseTwoSumStress(prngB, { maxN: 100 });

    assert.deepStrictEqual(stressA, stressB);
  });
});
