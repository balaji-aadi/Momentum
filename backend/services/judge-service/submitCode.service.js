import Submission from '../../models/submission.model.js';
import { DriverGeneratorService } from '../judge/driverGenerator/DriverGeneratorService.js';
import { SandboxOrchestrator } from '../judge/sandbox/SandboxOrchestrator.js';
import { ComparatorRegistry } from '../judge/comparators/ComparatorRegistry.js';

/**
 * Universal Student Submit Code Service (Phase 9 & 10)
 * 
 * Orchestrates Phase 3 (Input Parser), Phase 6 (Driver Generator),
 * Phase 10 (Sandbox Orchestrator & Execution Limits), and Phase 5 (Comparator Registry)
 * against hidden testcases, returning sanitized verdicts and persisting
 * submission records.
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

    // 1. Resolve Function Definition & Execution Profile
    const functionDefinition = problem?.functionDefinition || {
      functionName: 'twoSum',
      name: 'twoSum',
      parameters: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }],
      returnType: 'number[]'
    };

    const executionProfile = problem?.executionProfile || {
      runtimeType: 'FUNCTION',
      outputSerializer: 'ArraySerializer',
      comparator: 'UnorderedArrayMatch'
    };

    const comparatorName = executionProfile.comparator || 'ExactMatch';
    const returnType = functionDefinition.returnType || 'number[]';

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

    // 3. Generate Language Driver Harness (Phase 6)
    let driverSource = '';
    try {
      driverSource = DriverGeneratorService.generateDriverHarness(
        cleanLang,
        code,
        functionDefinition,
        executionProfile,
        evalTCs
      );
    } catch (genErr) {
      return {
        success: false,
        verdict: 'PROCESS_ERROR',
        error: `Driver harness generation error: ${genErr.message}`,
        passedTestCases: 0,
        totalTestCases: evalTCs.length,
        executionTimeMs: 0
      };
    }

    // 4. Execute inside Sandbox / Hardened Runner (Phase 10)
    const executionLimits = problem?.executionLimits || {};
    const processResult = await SandboxOrchestrator.execute({
      language: cleanLang,
      sourceCode: driverSource,
      executionLimits,
      testCasesCount: evalTCs.length,
      strictSandboxMode
    });

    let verdict = 'ACCEPTED';
    let passedCount = 0;
    let failedIdx = null;
    let safeError = null;

    // 5. Handle Global Process Failures
    if (processResult.status === 'SANDBOX_UNAVAILABLE') {
      verdict = 'SANDBOX_UNAVAILABLE';
      safeError = processResult.error || 'Sandbox unavailable.';
    } else if (processResult.status === 'PROCESS_ERROR') {
      verdict = 'PROCESS_ERROR';
      safeError = processResult.error || 'Process execution error.';
    } else if (processResult.status === 'COMPILE_ERROR') {
      verdict = 'COMPILE_ERROR';
      safeError = processResult.error || 'Compilation failed.';
    } else if (processResult.status === 'SYNTAX_ERROR') {
      verdict = 'SYNTAX_ERROR';
      safeError = processResult.error || 'Syntax error detected.';
    } else if (processResult.status === 'TIME_LIMIT_EXCEEDED') {
      verdict = 'TIME_LIMIT_EXCEEDED';
      safeError = `Time limit exceeded.`;
    } else if (processResult.status === 'MEMORY_LIMIT_EXCEEDED') {
      verdict = 'MEMORY_LIMIT_EXCEEDED';
      safeError = `Memory limit exceeded.`;
    } else if (processResult.status === 'OUTPUT_LIMIT_EXCEEDED') {
      verdict = 'OUTPUT_LIMIT_EXCEEDED';
      safeError = 'Output limit exceeded.';
    } else if (processResult.status === 'RUNTIME_ERROR') {
      verdict = 'RUNTIME_ERROR';
      failedIdx = processResult.envelope?.testCaseIndex !== undefined ? processResult.envelope.testCaseIndex : 0;
      safeError = processResult.envelope?.message || 'Runtime exception during execution.';
    } else {
      // 6. Successful Process Execution -> Evaluate with Phase 5 Comparator
      const executedOutputs = processResult.envelope?.results || [];

      for (let idx = 0; idx < evalTCs.length; idx++) {
        const tc = evalTCs[idx];
        const actualRecord = executedOutputs.find(r => r.testCaseIndex === idx);
        const actualOutput = actualRecord !== undefined ? actualRecord.output : null;

        if (actualRecord === undefined) {
          if (failedIdx === null) failedIdx = idx;
          verdict = 'WRONG_ANSWER';
          break;
        }

        const compResult = ComparatorRegistry.compare(
          actualOutput,
          tc.expectedOutput,
          comparatorName,
          {},
          returnType
        );

        if (compResult.passed === true) {
          passedCount++;
        } else {
          if (failedIdx === null) failedIdx = idx;
          verdict = 'WRONG_ANSWER';
          break; // Fail early on first failed hidden testcase
        }
      }

      if (passedCount === evalTCs.length) {
        verdict = 'ACCEPTED';
      }
    }

    // 7. Persist Submission in Database if problem instance exists
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
          totalTestCases: evalTCs.length,
          executionTimeMs: processResult.executionTimeMs || 0
        });
      } catch (dbErr) {
        console.error('Failed to persist submission record:', dbErr);
      }
    }

    // 8. Return Sanitized Response (NEVER expose hidden testcase inputs or expected outputs)
    return {
      success: true,
      verdict,
      passedTestCases: passedCount,
      totalTestCases: evalTCs.length,
      failedTestCaseIndex: failedIdx,
      executionTimeMs: processResult.executionTimeMs || 0,
      error: safeError,
      submissionId: submissionRecord?._id || null
    };
  }
}
