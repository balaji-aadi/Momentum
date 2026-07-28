import { describe, test } from 'node:test';
import assert from 'node:assert';
import { SeededPRNG } from '../services/judge/generators/prng/SeededPRNG.js';
import { UniquePairGeneratorPlugin } from '../services/judge/generators/plugins/UniquePairGeneratorPlugin.js';
import { ConstraintValidator } from '../services/judge/validators/ConstraintValidator.js';
import { ReferenceRunner } from '../services/judge/referenceRunner.js';

describe('Phase 1.5.8 Reference Solution Execution Engine', () => {
  test('1. JavaScript Reference Solution computes correct expected outputs for generated inputs', async () => {
    // Reference solution for Two Sum in JS
    const jsCode = `
      const map = new Map();
      for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) return [map.get(diff), i];
        map.set(nums[i], i);
      }
      return [];
    `;

    const functionDefinition = {
      name: 'twoSum',
      parameters: [{ name: 'nums' }, { name: 'target' }],
      returnType: 'array'
    };

    const testCases = [
      { input: { nums: [2, 7, 11, 15], target: 9 } },
      { input: { nums: [3, 2, 4], target: 6 } },
      { input: { nums: [3, 3], target: 6 } }
    ];

    const res = await ReferenceRunner.execute({
      language: 'javascript',
      referenceCode: jsCode,
      functionDefinition,
      testCases
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.compiledTestCases.length, 3);
    assert.deepStrictEqual(res.compiledTestCases[0].expectedOutput, [0, 1]);
    assert.deepStrictEqual(res.compiledTestCases[1].expectedOutput, [1, 2]);
    assert.deepStrictEqual(res.compiledTestCases[2].expectedOutput, [0, 1]);
  });

  test('2. Python Reference Solution computes expected outputs via Python Judge Pipeline', async () => {
    const pythonCode = `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in seen:\n                return [seen[diff], i]\n            seen[num] = i\n        return []`;

    const functionDefinition = {
      name: 'twoSum',
      parameters: [
        { name: 'nums', type: 'ARRAY_NUMBER' },
        { name: 'target', type: 'NUMBER' }
      ],
      returnType: 'ARRAY_NUMBER'
    };

    const testCases = [
      { input: { nums: [2, 7, 11, 15], target: 9 } },
      { input: { nums: [3, 2, 4], target: 6 } }
    ];

    const res = await ReferenceRunner.execute({
      language: 'python',
      referenceCode: pythonCode,
      functionDefinition,
      testCases
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.compiledTestCases.length, 2);
    assert.deepStrictEqual(res.compiledTestCases[0].expectedOutput, [0, 1]);
    assert.deepStrictEqual(res.compiledTestCases[1].expectedOutput, [1, 2]);
  });

  test('3. Full Integration: PRNG -> Plugin -> Validator -> ReferenceRunner', async () => {
    const prng = new SeededPRNG(133742);
    const plugin = new UniquePairGeneratorPlugin();

    // 1. Generate 5 valid Two Sum test cases
    const rawCases = [];
    for (let i = 0; i < 5; i++) {
      const { candidate } = ConstraintValidator.generateValidInput(
        plugin,
        prng,
        { lengthMin: 6, lengthMax: 8 },
        { rule: 'twoSum' }
      );
      rawCases.push(candidate);
    }

    const jsCode = `
      const map = new Map();
      for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) return [map.get(diff), i];
        map.set(nums[i], i);
      }
      return [];
    `;

    const functionDefinition = {
      name: 'twoSum',
      parameters: [{ name: 'nums' }, { name: 'target' }],
      returnType: 'array'
    };

    // 2. Execute ReferenceRunner
    const res = await ReferenceRunner.execute({
      language: 'javascript',
      referenceCode: jsCode,
      functionDefinition,
      testCases: rawCases
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.compiledTestCases.length, 5);

    // 3. Verify that every computed expectedOutput correctly solves the generated input
    res.compiledTestCases.forEach(tc => {
      const { nums, target } = tc.input;
      const [idx1, idx2] = tc.expectedOutput;
      assert.strictEqual(nums[idx1] + nums[idx2], target);
    });
  });
});
