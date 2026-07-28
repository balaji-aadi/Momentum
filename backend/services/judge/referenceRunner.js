import { executePythonJudge } from './pythonJudgeRunner.js';
import { ComparatorRegistry } from './comparators/ComparatorRegistry.js';

/**
 * ReferenceRunner - Sandboxed Reference Solution Execution Engine
 * Runs the problem author's canonical Python or JS reference solution over
 * generated random/stress inputs to auto-compute expected outputs.
 */
export class ReferenceRunner {
  /**
   * Executes reference code over input test cases and attaches computed expected outputs.
   * @param {Object} params
   * @param {string} params.language - 'python' | 'javascript'
   * @param {string} params.referenceCode - Author solution code
   * @param {Object} params.functionDefinition - Function schema { name, parameters, returnType }
   * @param {Array<Object>} params.testCases - Raw testcase candidate objects [{ input: { ... } }, ...]
   * @param {Object} [params.executionProfile] - Execution settings
   * @param {number} [params.timeLimitMs=5000] - Sandbox timeout
   * @returns {Promise<{ success: boolean, compiledTestCases: Array<Object>, error?: string }>}
   */
  static async execute({
    language = 'python',
    referenceCode,
    functionDefinition,
    testCases = [],
    executionProfile = {},
    timeLimitMs = 5000
  }) {
    if (!referenceCode || typeof referenceCode !== 'string') {
      throw new Error("ReferenceRunner requires a valid referenceCode string.");
    }
    if (!testCases || testCases.length === 0) {
      return { success: true, compiledTestCases: [] };
    }

    // Format test cases with temporary dummy expected outputs for the driver harness
    const formattedCases = testCases.map((tc, idx) => ({
      testCaseIndex: idx + 1,
      input: tc.input || tc,
      expectedOutput: null
    }));

    const cleanLang = (language || '').toLowerCase().trim();

    if (cleanLang.includes('python')) {
      const judgeRes = await executePythonJudge({
        studentCode: referenceCode,
        functionDefinition,
        executionProfile,
        testCases: formattedCases,
        timeLimitMs
      });

      if (judgeRes.status === 'Runtime Error' || judgeRes.status === 'Security Error' || judgeRes.status === 'Time Limit Exceeded') {
        return {
          success: false,
          error: `Reference Solution Execution Failed (${judgeRes.status}): ${judgeRes.error || judgeRes.message || 'Error running reference code.'}`,
          compiledTestCases: []
        };
      }

      // Map outputs back to compiled test cases
      const compiledTestCases = (judgeRes.results || []).map((item, idx) => {
        const origCase = testCases[idx] || {};
        const normalizedOutput = ComparatorRegistry.normalizeValue(item.actualOutput);
        return {
          testCaseIndex: idx + 1,
          input: origCase.input || origCase,
          expectedOutput: normalizedOutput,
          executionTimeMs: item.executionTimeMs || 0,
          isStress: origCase.isStress || false,
          category: origCase.category || 'Standard'
        };
      });

      return {
        success: true,
        compiledTestCases
      };
    }

    // JS execution fallback for in-memory JavaScript reference code
    try {
      const funcName = functionDefinition?.name || 'solve';
      const paramNames = functionDefinition?.parameters?.map(p => p.name) || ['nums'];

      const fn = new Function(...paramNames, referenceCode);
      const compiledTestCases = [];

      for (let idx = 0; idx < testCases.length; idx++) {
        const origCase = testCases[idx] || {};
        const rawInput = origCase.input || origCase;
        const start = Date.now();

        // Extract args in order matching function definition parameters with alias & positional fallback
        const rawVals = typeof rawInput === 'object' && rawInput !== null ? Object.values(rawInput) : [rawInput];
        const genericAliases = ['nums', 'arr', 'array', 'values', 'list', 'items', 'elements', 'target', 'k', 'n', 'matrix', 'grid', 's', 'str'];
        const args = paramNames.map((p, pIdx) => {
          let val = rawInput?.[p];
          if (val === undefined && typeof rawInput === 'object' && rawInput !== null) {
            const alias = genericAliases.find(a => rawInput[a] !== undefined && !paramNames.includes(a));
            if (alias) {
              val = rawInput[alias];
            } else if (pIdx < rawVals.length) {
              val = rawVals[pIdx];
            }
          }
          return val;
        });
        const output = fn(...args);
        const executionTimeMs = Date.now() - start;

        const normalizedOutput = ComparatorRegistry.normalizeValue(output);
        compiledTestCases.push({
          testCaseIndex: idx + 1,
          input: rawInput,
          expectedOutput: normalizedOutput,
          executionTimeMs,
          isStress: origCase.isStress || false,
          category: origCase.category || 'Standard'
        });
      }

      return {
        success: true,
        compiledTestCases
      };
    } catch (jsErr) {
      return {
        success: false,
        error: `Reference Solution Execution Failed (JS Error): ${jsErr.message}`,
        compiledTestCases: []
      };
    }
  }
}
