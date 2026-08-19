import { DriverGeneratorService } from '../judge/driverGenerator/DriverGeneratorService.js';
import { SandboxOrchestrator } from '../judge/sandbox/SandboxOrchestrator.js';
import { ComparatorRegistry } from '../judge/comparators/ComparatorRegistry.js';

/**
 * Universal Student Run Code Service (Phase 8 & 10)
 * 
 * Orchestrates Phase 3 (Input Parser), Phase 6 (Driver Generator),
 * Phase 10 (Sandbox Orchestrator & Execution Limits), and Phase 5 (Comparator Registry)
 * for student-facing visible testcase execution.
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
    if (!code || typeof code !== 'string' || !code.trim()) {
      return {
        success: false,
        status: 'PROCESS_ERROR',
        error: 'Code parameter cannot be empty.',
        totalTestCases: 0,
        passedTestCases: 0,
        testCases: []
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
      // Default fallback testcases for standalone testing
      visibleTCs = [
        { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] },
        { input: { nums: [3, 2, 4], target: 6 }, expectedOutput: [1, 2] }
      ];
    }

    // 3. Generate Language Driver Harness (Phase 6)
    let driverSource = '';
    try {
      driverSource = DriverGeneratorService.generateDriverHarness(
        cleanLang,
        code,
        functionDefinition,
        executionProfile,
        visibleTCs
      );
    } catch (genErr) {
      return {
        success: false,
        status: 'PROCESS_ERROR',
        error: `Driver harness generation error: ${genErr.message}`,
        totalTestCases: visibleTCs.length,
        passedTestCases: 0,
        testCases: []
      };
    }

    // 4. Execute inside Sandbox / Hardened Runner (Phase 10)
    const executionLimits = problem?.executionLimits || {};
    const processResult = await SandboxOrchestrator.execute({
      language: cleanLang,
      sourceCode: driverSource,
      executionLimits,
      testCasesCount: visibleTCs.length,
      strictSandboxMode
    });

    // 5. Handle Global Failure Modes (Sandbox Unavailable, Process Error, Compile Error, Syntax Error, Timeout, Output Limit, Memory Limit)
    if (processResult.status === 'SANDBOX_UNAVAILABLE') {
      return {
        success: false,
        status: 'SANDBOX_UNAVAILABLE',
        error: processResult.error || 'Sandbox runtime is not available.',
        totalTestCases: visibleTCs.length,
        passedTestCases: 0,
        executionTimeMs: 0,
        testCases: []
      };
    }

    if (processResult.status === 'PROCESS_ERROR') {
      return {
        success: false,
        status: 'PROCESS_ERROR',
        error: processResult.error || 'Process execution error.',
        totalTestCases: visibleTCs.length,
        passedTestCases: 0,
        executionTimeMs: processResult.executionTimeMs || 0,
        testCases: []
      };
    }

    if (processResult.status === 'COMPILE_ERROR') {
      return {
        success: false,
        status: 'COMPILE_ERROR',
        error: processResult.error || processResult.stderr,
        totalTestCases: visibleTCs.length,
        passedTestCases: 0,
        executionTimeMs: processResult.executionTimeMs,
        testCases: []
      };
    }

    if (processResult.status === 'SYNTAX_ERROR') {
      return {
        success: false,
        status: 'SYNTAX_ERROR',
        error: processResult.error || processResult.stderr,
        totalTestCases: visibleTCs.length,
        passedTestCases: 0,
        executionTimeMs: processResult.executionTimeMs,
        testCases: []
      };
    }

    if (processResult.status === 'TIME_LIMIT_EXCEEDED') {
      return {
        success: false,
        status: 'TIME_LIMIT_EXCEEDED',
        error: processResult.error || `Execution timed out exceeding limit.`,
        totalTestCases: visibleTCs.length,
        passedTestCases: 0,
        executionTimeMs: processResult.executionTimeMs,
        testCases: []
      };
    }

    if (processResult.status === 'MEMORY_LIMIT_EXCEEDED') {
      return {
        success: false,
        status: 'MEMORY_LIMIT_EXCEEDED',
        error: processResult.error || `Execution exceeded allocated memory limit.`,
        totalTestCases: visibleTCs.length,
        passedTestCases: 0,
        executionTimeMs: processResult.executionTimeMs,
        testCases: []
      };
    }

    if (processResult.status === 'OUTPUT_LIMIT_EXCEEDED') {
      return {
        success: false,
        status: 'OUTPUT_LIMIT_EXCEEDED',
        error: processResult.error || 'Execution exceeded output buffer limit.',
        totalTestCases: visibleTCs.length,
        passedTestCases: 0,
        executionTimeMs: processResult.executionTimeMs,
        testCases: []
      };
    }

    // 6. Handle Runtime Error from Envelope
    if (processResult.status === 'RUNTIME_ERROR') {
      const errIdx = processResult.envelope?.testCaseIndex !== undefined ? processResult.envelope.testCaseIndex : 0;
      return {
        success: false,
        status: 'RUNTIME_ERROR',
        error: processResult.envelope?.message || processResult.error || 'Runtime Exception',
        errorType: processResult.envelope?.errorType || 'RuntimeError',
        failedTestCaseIndex: errIdx,
        totalTestCases: visibleTCs.length,
        passedTestCases: 0,
        executionTimeMs: processResult.executionTimeMs,
        testCases: visibleTCs.map((tc, idx) => ({
          testCaseIndex: idx,
          status: idx === errIdx ? 'RUNTIME_ERROR' : 'SKIPPED',
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: null,
          error: idx === errIdx ? (processResult.envelope?.message || 'Runtime Error') : null
        }))
      };
    }

    // 7. Evaluate Successful Process Execution with Phase 5 Comparator
    const executedOutputs = processResult.envelope?.results || [];
    const testCaseResults = [];
    let passedCount = 0;

    for (let idx = 0; idx < visibleTCs.length; idx++) {
      const tc = visibleTCs[idx];
      const actualRecord = executedOutputs.find(r => r.testCaseIndex === idx);
      const actualOutput = actualRecord !== undefined ? actualRecord.output : null;

      // Phase 5 Comparison
      let compResult = { passed: false, reason: 'No output captured', code: 'ELEMENT_MISMATCH' };
      if (actualRecord !== undefined) {
        compResult = ComparatorRegistry.compare(
          actualOutput,
          tc.expectedOutput,
          comparatorName,
          {},
          returnType
        );
      }

      const isPassed = compResult.passed === true;
      if (isPassed) passedCount++;

      testCaseResults.push({
        testCaseIndex: idx,
        status: isPassed ? 'PASSED' : 'WRONG_ANSWER',
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: actualOutput,
        reason: compResult.reason,
        code: compResult.code,
        details: compResult.details || {}
      });
    }

    const allPassed = passedCount === visibleTCs.length;

    return {
      success: true,
      status: allPassed ? 'PASSED' : 'WRONG_ANSWER',
      totalTestCases: visibleTCs.length,
      passedTestCases: passedCount,
      executionTimeMs: processResult.executionTimeMs,
      testCases: testCaseResults
    };
  }
}
