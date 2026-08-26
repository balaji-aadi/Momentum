import { DriverGeneratorService } from '../driverGenerator/DriverGeneratorService.js';
import { SandboxOrchestrator } from '../sandbox/SandboxOrchestrator.js';
import { ComparatorRegistry } from '../comparators/ComparatorRegistry.js';

/**
 * CoreJudgeExecutor - Transport-Independent, Side-Effect-Free Execution Engine
 * (Phase 11 Core Executor)
 * 
 * Encapsulates the frozen Phase 1–10 judging pipeline:
 * Driver Harness Generation -> Process Execution / Sandbox -> Envelope Parsing -> Output Comparison -> Verdict Synthesis.
 * 
 * MUST NOT contain Express HTTP references or MongoDB persistence calls.
 */
export class CoreJudgeExecutor {
  /**
   * Executes code against a set of testcases using the frozen Phase 1–10 engine.
   * 
   * @param {Object} params
   * @param {string} params.language Selected programming language ('python', 'javascript', 'cpp', 'java')
   * @param {string} params.code Source code submitted by student
   * @param {Object} params.functionDefinition Schema { functionName, parameters, returnType }
   * @param {Object} params.executionProfile Profile { runtimeType, outputSerializer, comparator }
   * @param {Array} params.testCases Array of { input, expectedOutput }
   * @param {Object} [params.executionLimits] Resource caps { timeLimitMs, memoryLimitMb }
   * @param {boolean} [params.strictSandboxMode] Force strict container sandbox driver
   * @param {boolean} [params.isSubmit=false] Flag indicating if evaluating hidden testcases
   * @returns {Promise<Object>} Execution verdict & testcase outcomes
   */
  static async execute({
    language = 'javascript',
    code,
    functionDefinition,
    executionProfile,
    testCases = [],
    executionLimits = {},
    strictSandboxMode = false,
    isSubmit = false
  }) {
    if (!code || typeof code !== 'string' || !code.trim()) {
      return {
        success: false,
        status: 'PROCESS_ERROR',
        verdict: 'PROCESS_ERROR',
        error: 'Code parameter cannot be empty.',
        totalTestCases: testCases.length,
        passedTestCases: 0,
        failedTestCaseIndex: null,
        executionTimeMs: 0,
        testCases: []
      };
    }

    const cleanLang = (language || 'javascript').toLowerCase().trim();

    // 1. Resolve Function Definition & Execution Profile defaults safely
    const hasFuncDef = functionDefinition && Object.keys(functionDefinition).length > 0 && (functionDefinition.name || functionDefinition.functionName);
    const funcDef = hasFuncDef ? functionDefinition : {
      functionName: 'twoSum',
      name: 'twoSum',
      parameters: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }],
      returnType: 'number[]'
    };

    const hasExecProfile = executionProfile && Object.keys(executionProfile).length > 0;
    const execProfile = hasExecProfile ? executionProfile : {
      runtimeType: 'FUNCTION',
      outputSerializer: 'ArraySerializer',
      comparator: 'UnorderedArrayMatch'
    };

    const comparatorName = execProfile.comparator || 'ExactMatch';
    const returnType = funcDef.returnType || 'number[]';

    // 2. Format Test Cases
    const evalCases = Array.isArray(testCases) && testCases.length > 0
      ? testCases.map(tc => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          explanation: tc.explanation || ''
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
        funcDef,
        execProfile,
        evalCases
      );
    } catch (genErr) {
      return {
        success: false,
        status: 'PROCESS_ERROR',
        verdict: 'PROCESS_ERROR',
        error: `Driver harness generation error: ${genErr.message}`,
        totalTestCases: evalCases.length,
        passedTestCases: 0,
        failedTestCaseIndex: null,
        executionTimeMs: 0,
        testCases: []
      };
    }

    // 4. Execute inside Sandbox / Hardened Runner (Phase 7 / Phase 10)
    const processResult = await SandboxOrchestrator.execute({
      language: cleanLang,
      sourceCode: driverSource,
      executionLimits,
      testCasesCount: evalCases.length,
      strictSandboxMode
    });

    // 5. Handle Global Failure Modes
    if (processResult.status === 'SANDBOX_UNAVAILABLE') {
      return {
        success: false,
        status: 'SANDBOX_UNAVAILABLE',
        verdict: 'SANDBOX_UNAVAILABLE',
        error: processResult.error || 'Sandbox runtime is not available.',
        totalTestCases: evalCases.length,
        passedTestCases: 0,
        failedTestCaseIndex: null,
        executionTimeMs: 0,
        testCases: []
      };
    }

    if (processResult.status === 'PROCESS_ERROR') {
      return {
        success: false,
        status: 'PROCESS_ERROR',
        verdict: 'PROCESS_ERROR',
        error: processResult.error || 'Process execution error.',
        totalTestCases: evalCases.length,
        passedTestCases: 0,
        failedTestCaseIndex: null,
        executionTimeMs: processResult.executionTimeMs || 0,
        testCases: []
      };
    }

    if (processResult.status === 'COMPILE_ERROR') {
      return {
        success: false,
        status: 'COMPILE_ERROR',
        verdict: 'COMPILE_ERROR',
        error: processResult.error || processResult.stderr,
        totalTestCases: evalCases.length,
        passedTestCases: 0,
        failedTestCaseIndex: null,
        executionTimeMs: processResult.executionTimeMs || 0,
        testCases: []
      };
    }

    if (processResult.status === 'SYNTAX_ERROR') {
      return {
        success: false,
        status: 'SYNTAX_ERROR',
        verdict: 'SYNTAX_ERROR',
        error: processResult.error || processResult.stderr,
        totalTestCases: evalCases.length,
        passedTestCases: 0,
        failedTestCaseIndex: null,
        executionTimeMs: processResult.executionTimeMs || 0,
        testCases: []
      };
    }

    if (processResult.status === 'TIME_LIMIT_EXCEEDED') {
      return {
        success: false,
        status: 'TIME_LIMIT_EXCEEDED',
        verdict: 'TIME_LIMIT_EXCEEDED',
        error: processResult.error || 'Execution timed out exceeding limit.',
        totalTestCases: evalCases.length,
        passedTestCases: 0,
        failedTestCaseIndex: null,
        executionTimeMs: processResult.executionTimeMs || 0,
        testCases: []
      };
    }

    if (processResult.status === 'MEMORY_LIMIT_EXCEEDED') {
      return {
        success: false,
        status: 'MEMORY_LIMIT_EXCEEDED',
        verdict: 'MEMORY_LIMIT_EXCEEDED',
        error: processResult.error || 'Execution exceeded allocated memory limit.',
        totalTestCases: evalCases.length,
        passedTestCases: 0,
        failedTestCaseIndex: null,
        executionTimeMs: processResult.executionTimeMs || 0,
        testCases: []
      };
    }

    if (processResult.status === 'OUTPUT_LIMIT_EXCEEDED') {
      return {
        success: false,
        status: 'OUTPUT_LIMIT_EXCEEDED',
        verdict: 'OUTPUT_LIMIT_EXCEEDED',
        error: processResult.error || 'Execution exceeded output buffer limit.',
        totalTestCases: evalCases.length,
        passedTestCases: 0,
        failedTestCaseIndex: null,
        executionTimeMs: processResult.executionTimeMs || 0,
        testCases: []
      };
    }

    if (processResult.status === 'RUNTIME_ERROR') {
      const errIdx = processResult.envelope?.testCaseIndex !== undefined ? processResult.envelope.testCaseIndex : 0;
      return {
        success: false,
        status: 'RUNTIME_ERROR',
        verdict: 'RUNTIME_ERROR',
        error: processResult.envelope?.message || processResult.error || 'Runtime Exception',
        errorType: processResult.envelope?.errorType || 'RuntimeError',
        failedTestCaseIndex: errIdx,
        totalTestCases: evalCases.length,
        passedTestCases: 0,
        executionTimeMs: processResult.executionTimeMs || 0,
        testCases: isSubmit ? [] : evalCases.map((tc, idx) => ({
          testCaseIndex: idx,
          status: idx === errIdx ? 'RUNTIME_ERROR' : 'SKIPPED',
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: null,
          error: idx === errIdx ? (processResult.envelope?.message || 'Runtime Error') : null
        }))
      };
    }

    // 6. Extract Outputs from Process Envelope or Stdout Sentinel Markers
    let executedOutputs = [];
    if (processResult.envelope && Array.isArray(processResult.envelope.results)) {
      executedOutputs = processResult.envelope.results;
    } else if (processResult.stdout) {
      const startMarker = '__SARTHI_JUDGE_OUTPUT_START__';
      const endMarker = '__SARTHI_JUDGE_OUTPUT_END__';
      const sIdx = processResult.stdout.indexOf(startMarker);
      const eIdx = processResult.stdout.indexOf(endMarker);
      if (sIdx !== -1 && eIdx !== -1) {
        try {
          const jsonStr = processResult.stdout.substring(sIdx + startMarker.length, eIdx).trim();
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) {
            executedOutputs = parsed.map(item => ({
              testCaseIndex: item.testCaseIndex,
              output: item.actualOutput !== undefined ? item.actualOutput : item.output,
              actualOutput: item.actualOutput !== undefined ? item.actualOutput : item.output,
              success: item.success !== false,
              error: item.error
            }));
          }
        } catch (e) {}
      }
    }

    // 7. Evaluate Process Execution Outputs with Phase 5 Comparator
    const testCaseResults = [];
    let passedCount = 0;
    let failedIdx = null;

    for (let idx = 0; idx < evalCases.length; idx++) {
      const tc = evalCases[idx];
      const actualRecord = executedOutputs.find(r => r.testCaseIndex === idx || r.testCaseIndex === idx + 1);
      const actualOutput = actualRecord !== undefined ? (actualRecord.actualOutput !== undefined ? actualRecord.actualOutput : actualRecord.output) : null;

      let compResult = { passed: false, reason: 'No output captured', code: 'ELEMENT_MISMATCH' };
      if (actualRecord !== undefined && actualRecord.success !== false) {
        compResult = ComparatorRegistry.compare(
          actualOutput,
          tc.expectedOutput,
          comparatorName,
          {},
          returnType
        );
      }

      const isPassed = compResult.passed === true;
      if (isPassed) {
        passedCount++;
      } else {
        if (failedIdx === null) failedIdx = idx;
        if (isSubmit) break; // Fail early for submission
      }

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

    const allPassed = passedCount === evalCases.length;
    const finalStatus = allPassed ? 'PASSED' : 'WRONG_ANSWER';
    const finalVerdict = allPassed ? 'ACCEPTED' : 'WRONG_ANSWER';

    return {
      success: isSubmit ? allPassed : true,
      status: finalStatus,
      verdict: finalVerdict,
      totalTestCases: evalCases.length,
      passedTestCases: passedCount,
      failedTestCaseIndex: failedIdx,
      executionTimeMs: processResult.executionTimeMs || 0,
      testCases: isSubmit ? [] : testCaseResults
    };
  }
}
