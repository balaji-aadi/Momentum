import Submission from '../../models/submission.model.js';
import { CoreJudgeExecutor } from '../judge/executor/CoreJudgeExecutor.js';

/**
 * Universal Student Submit Code Service (Phase 9 & 10)
 * 
 * Thin service wrapper that resolves hidden testcases, delegates execution
 * to transport-independent CoreJudgeExecutor, and persists official Submission records.
 */
export class SubmitCodeService {
  /**
   * Executes student code against hidden testcases and determines final verdict.
   * 
   * @param {Object} params
   * @param {Object} params.problem Problem model instance
   * @param {string} params.language Selected programming language ('javascript', 'python', 'cpp', 'java')
   * @param {string} params.code Student's solution code
   * @param {string|null} [params.userId] Optional submitting user ID
   * @param {boolean} [params.strictSandboxMode] Force strict container sandbox
   * @returns {Promise<Object>} Sanitized student-facing Submit execution result
   */
  static async submit({ problem, language = 'javascript', code, userId = null, strictSandboxMode = false }) {
    if (!code || typeof code !== 'string' || !code.trim()) {
      return {
        success: false,
        verdict: 'PROCESS_ERROR',
        error: 'Code parameter cannot be empty.',
        passedTestCases: 0,
        totalTestCases: 0,
        executionTimeMs: 0
      };
    }

    const cleanLang = (language || 'javascript').toLowerCase().trim();
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

    // 2. Select Hidden Test Cases for Submission
    const hiddenTCs = Array.isArray(problem?.hiddenTestCases) && problem.hiddenTestCases.length > 0
      ? problem.hiddenTestCases
      : (Array.isArray(problem?.visibleTestCases) ? problem.visibleTestCases : []);

    const evalTCs = hiddenTCs.length > 0
      ? hiddenTCs.map(tc => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput
        }))
      : [
          { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
          { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] }
        ];

    const executionLimits = problem?.executionLimits || {};

    // 3. Delegate to CoreJudgeExecutor
    const execResult = await CoreJudgeExecutor.execute({
      language: cleanLang,
      code,
      functionDefinition,
      executionProfile,
      testCases: evalTCs,
      executionLimits,
      strictSandboxMode,
      isSubmit: true
    });

    const verdict = execResult.verdict || 'PROCESS_ERROR';
    const passedCount = execResult.passedTestCases || 0;
    const failedIdx = execResult.failedTestCaseIndex;
    const safeError = execResult.error || null;
    const totalCount = execResult.totalTestCases || evalTCs.length;
    const timeMs = execResult.executionTimeMs || 0;

    // 4. Persist Submission Record in Database if problem instance exists
    let submissionRecord = null;
    if (problem && problem._id) {
      try {
        submissionRecord = await Submission.create({
          userId: userId || null,
          problemId: problem._id,
          problemCode: problem.problemCode || '',
          language: cleanLang,
          code,
          verdict,
          passedTestCases: passedCount,
          totalTestCases: totalCount,
          executionTimeMs: timeMs
        });
      } catch (dbErr) {
        console.error('Failed to persist submission record:', dbErr);
      }
    }

    // 5. Return Sanitized Response (NEVER expose hidden testcase inputs or expected outputs)
    return {
      success: true,
      verdict,
      passedTestCases: passedCount,
      totalTestCases: totalCount,
      failedTestCaseIndex: failedIdx,
      executionTimeMs: timeMs,
      error: safeError,
      submissionId: submissionRecord?._id || null
    };
  }
}
