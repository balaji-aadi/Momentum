import { describe, test } from 'node:test';
import assert from 'node:assert';
import { ProblemPackageCompiler } from '../services/judge/ProblemPackageCompiler.js';

describe('Phase 1.5.10 Package Compilation Backend API & Package Versioning', () => {
  const sampleSpec = {
    problemId: 'two-sum-v1',
    title: 'Two Sum',
    functionDefinition: {
      name: 'twoSum',
      parameters: [{ name: 'nums' }, { name: 'target' }],
      returnType: 'array'
    },
    generatorName: 'UniquePairGeneratorPlugin',
    generatorOptions: { lengthMin: 5, lengthMax: 8 },
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
    randomCount: 5,
    stressCount: 1,
    seed: 424242
  };

  test('1. ProblemPackageCompiler compiles complete self-contained package with metadata and hash', async () => {
    const pkg = await ProblemPackageCompiler.compilePackage(sampleSpec);

    assert.strictEqual(pkg.packageVersion, 'v1.0.0');
    assert.strictEqual(typeof pkg.hashSignature, 'string');
    assert.strictEqual(pkg.hashSignature.length, 64); // sha256 hex
    assert.strictEqual(pkg.metadata.problemId, 'two-sum-v1');
    assert.strictEqual(pkg.metadata.totalTestCases, 6); // 5 random + 1 stress
    assert.strictEqual(pkg.hiddenTestCases.length, 6);

    // Verify expected outputs were pre-computed correctly
    pkg.hiddenTestCases.forEach(tc => {
      const { nums, target } = tc.input;
      const [i, j] = tc.expectedOutput;
      assert.strictEqual(nums[i] + nums[j], target);
    });
  });

  test('2. Deterministic Seed produces identical package hash signature across runs', async () => {
    const pkgA = await ProblemPackageCompiler.compilePackage(sampleSpec);
    const pkgB = await ProblemPackageCompiler.compilePackage(sampleSpec);

    assert.strictEqual(pkgA.hashSignature, pkgB.hashSignature);
    const normalizeCases = cases => cases.map(c => ({ input: c.input, expectedOutput: c.expectedOutput, isStress: c.isStress }));
    assert.deepStrictEqual(normalizeCases(pkgA.hiddenTestCases), normalizeCases(pkgB.hiddenTestCases));
  });

  test('3. Stress testcases are flagged with isStress: true metadata', async () => {
    const pkg = await ProblemPackageCompiler.compilePackage(sampleSpec);
    const stressCase = pkg.hiddenTestCases.find(tc => tc.isStress);

    assert.strictEqual(stressCase !== undefined, true);
    assert.strictEqual(stressCase.isStress, true);
    assert.strictEqual(typeof stressCase.category, 'string');
  });

  test('4. Throws error when missing required functionDefinition or referenceCode', async () => {
    await assert.rejects(
      async () => {
        await ProblemPackageCompiler.compilePackage({ ...sampleSpec, referenceCode: null });
      },
      { message: /referenceCode is required/ }
    );
  });
});
