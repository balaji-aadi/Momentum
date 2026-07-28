import { describe, test } from 'node:test';
import assert from 'node:assert';
import { ProblemPackageCompiler } from '../services/judge/ProblemPackageCompiler.js';

describe('Phase 1.5.11 CMS Problem Package Studio UI & End-to-End Integration', () => {
  const uiPayload = {
    problemId: 'two-sum-studio-test',
    title: 'Two Sum Studio',
    functionDefinition: {
      name: 'twoSum',
      parameters: [{ name: 'nums' }, { name: 'target' }],
      returnType: 'array'
    },
    generatorName: 'UniquePairGeneratorPlugin',
    generatorOptions: { lengthMin: 5, lengthMax: 10, valueMin: -50, valueMax: 50 },
    constraints: { rule: 'twoSum' },
    referenceLanguage: 'javascript',
    referenceCode: `
      const map = new Map();
      for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) return [map.get(diff), i];
        map.set(nums[i], i);
      }
      return [];
    `,
    comparatorName: 'ExactMatch',
    randomCount: 4,
    stressCount: 1,
    seed: 9999
  };

  test('1. Studio UI Compilation Payload triggers full ProblemPackageCompiler pipeline', async () => {
    const pkg = await ProblemPackageCompiler.compilePackage(uiPayload);

    assert.strictEqual(pkg.packageVersion, 'v1.0.0');
    assert.strictEqual(pkg.metadata.problemId, 'two-sum-studio-test');
    assert.strictEqual(pkg.metadata.randomCasesCount, 4);
    assert.strictEqual(pkg.metadata.stressCasesCount, 1);
    assert.strictEqual(pkg.hiddenTestCases.length, 5);
    assert.strictEqual(typeof pkg.hashSignature, 'string');
  });

  test('2. Mongo Publishing transformation converts compiled test cases to database schema format', async () => {
    const pkg = await ProblemPackageCompiler.compilePackage(uiPayload);

    // Simulate problem.controller publish transformation
    const hiddenTestCases = pkg.hiddenTestCases.map(tc => ({
      input: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
      expectedOutput: typeof tc.expectedOutput === 'string' ? tc.expectedOutput : JSON.stringify(tc.expectedOutput),
      isHidden: true,
      explanation: tc.category || 'Generated Testcase'
    }));

    assert.strictEqual(hiddenTestCases.length, 5);
    assert.strictEqual(typeof hiddenTestCases[0].input, 'string');
    assert.strictEqual(typeof hiddenTestCases[0].expectedOutput, 'string');

    // Parse and verify first case
    const parsedInput = JSON.parse(hiddenTestCases[0].input);
    const parsedOutput = JSON.parse(hiddenTestCases[0].expectedOutput);

    const [i, j] = parsedOutput;
    assert.strictEqual(parsedInput.nums[i] + parsedInput.nums[j], parsedInput.target);
  });
});
