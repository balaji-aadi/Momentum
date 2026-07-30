import { JavaScriptSandboxRunner } from './runners/JavaScriptSandboxRunner.js';
import { PythonSandboxRunner } from './runners/PythonSandboxRunner.js';
import { VerdictEngine } from './VerdictEngine.js';
import { ProviderRegistry } from '../registries/ProviderRegistry.js';

/**
 * StatelessJudgeRuntime - 100% Stateless O(1) Execution Engine
 * Evaluates submissions directly against sealed ProblemPackage assets without dynamic inference overhead.
 */
export class StatelessJudgeRuntime {
  static async evaluateSubmission({ problemPackage, userCode, language = 'javascript' }) {
    const pkg = typeof problemPackage.toJSON === 'function' ? problemPackage.toJSON() : problemPackage;
    const functionName = pkg.signature.functionName || 'solve';
    const limits = pkg.executionProfile || { timeLimitMs: 2000, memoryLimitMb: 256 };
    const comparatorId = pkg.resolvedPlugins?.comparatorId || 'PrimitiveComparator';

    const comparator = ProviderRegistry.getProvider('COMPARATOR', comparatorId);

    const testCases = [
      ...(pkg.testCases?.public || []),
      ...(pkg.testCases?.hidden || [])
    ];

    let overallVerdict = VerdictEngine.VERDICTS.ACCEPTED;
    let totalTimeMs = 0;
    let maxMemoryMb = 0;
    const caseResults = [];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const inputArgs = Object.values(tc.input || {});
      const expectedOutput = tc.expectedOutput;

      let runRes;
      if (language === 'python' || language === 'py') {
        runRes = await PythonSandboxRunner.run({ userCode, functionName, inputArgs, timeLimitMs: limits.timeLimitMs });
      } else {
        runRes = await JavaScriptSandboxRunner.run({ userCode, functionName, inputArgs, timeLimitMs: limits.timeLimitMs });
      }

      totalTimeMs = Math.max(totalTimeMs, runRes.executionTimeMs);
      maxMemoryMb = Math.max(maxMemoryMb, runRes.memoryMb);

      let isMatch = false;
      if (runRes.success) {
        if (comparator) {
          isMatch = comparator.compare(runRes.actualOutput, expectedOutput);
        } else {
          isMatch = JSON.stringify(runRes.actualOutput) === JSON.stringify(expectedOutput);
        }
      }

      const caseVerdict = VerdictEngine.evaluateCase({
        isMatch,
        actualOutput: runRes.actualOutput,
        expectedOutput,
        executionTimeMs: runRes.executionTimeMs,
        memoryMb: runRes.memoryMb,
        limits,
        error: runRes.error
      });

      caseResults.push({
        caseIndex: i + 1,
        status: caseVerdict.status,
        executionTimeMs: caseVerdict.executionTimeMs,
        actualOutput: caseVerdict.actualOutput,
        expectedOutput: caseVerdict.expectedOutput
      });

      if (caseVerdict.status !== VerdictEngine.VERDICTS.ACCEPTED) {
        overallVerdict = caseVerdict.status;
        break; // Stop execution on first failing test case
      }
    }

    return {
      status: overallVerdict,
      problemId: pkg.problemId,
      packageVersion: pkg.packageVersion,
      hashSignature: pkg.hashSignature,
      totalCases: testCases.length,
      passedCases: caseResults.filter(c => c.status === VerdictEngine.VERDICTS.ACCEPTED).length,
      maxExecutionTimeMs: Math.round(totalTimeMs),
      maxMemoryMb,
      caseResults
    };
  }
}
