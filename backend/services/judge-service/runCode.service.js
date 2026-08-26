import { CoreJudgeExecutor } from '../judge/executor/CoreJudgeExecutor.js';

/**
 * Universal Student Run Code Service (Phase 8 & 10)
 * 
 * Thin service wrapper that resolves problem testcases and delegates execution
 * to transport-independent CoreJudgeExecutor.
 */
export class RunCodeService {
  /**
   * Executes student code against visible testcases.
   * 
   * @param {Object} params
   * @param {Object} params.problem Problem model instance
   * @param {string} params.language Selected programming language ('javascript', 'python', 'cpp', 'java')
   * @param {string} params.code Student's solution code
   * @param {Array} [params.customTestCases] Optional custom testcases provided by student
   * @param {boolean} [params.strictSandboxMode] Force strict container sandbox
   * @returns {Promise<Object>} Formatted student-facing Run execution result
   */
  static async run({ problem, language = 'javascript', code, customTestCases, strictSandboxMode = false }) {
    const probObj = problem && typeof problem.toObject === 'function' ? problem.toObject() : problem;

    // 1. Resolve Function Definition & Execution Profile
    const functionDefinition = probObj?.functionDefinition || {
      functionName: 'twoSum',
      name: 'twoSum',
      parameters: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }],
      returnType: 'number[]'
    };

    const executionProfile = probObj?.executionProfile || {
      runtimeType: 'FUNCTION',
      outputSerializer: 'ArraySerializer',
      comparator: 'UnorderedArrayMatch'
    };

    // 2. Select ONLY Visible Test Cases (Strictly NEVER expose or execute hidden testcases)
    let visibleTCs = [];
    if (Array.isArray(customTestCases) && customTestCases.length > 0) {
      visibleTCs = customTestCases;
    } else if (Array.isArray(problem?.visibleTestCases) && problem.visibleTestCases.length > 0) {
      visibleTCs = problem.visibleTestCases.map(tc => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        explanation: tc.explanation || ''
      }));
    } else {
      visibleTCs = [
        { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
        { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] }
      ];
    }

    const executionLimits = problem?.executionLimits || {};

    // 3. Delegate to CoreJudgeExecutor
    const execResult = await CoreJudgeExecutor.execute({
      language,
      code,
      functionDefinition,
      executionProfile,
      testCases: visibleTCs,
      executionLimits,
      strictSandboxMode,
      isSubmit: false
    });

    return execResult;
  }
}
