import { spawn } from 'child_process';
import { DriverGeneratorService } from './driverGenerator/DriverGeneratorService.js';
import { ComparatorRegistry } from './comparators/ComparatorRegistry.js';
import { sanitizeStudentCode } from './securitySanitizer.js';

/**
 * Universal Python Judge Runner Pipeline
 * Executes Python solution code against testcases in an isolated child process.
 */
export async function executePythonJudge({
  studentCode,
  functionDefinition,
  executionProfile,
  testCases = [],
  timeLimitMs = 2000
}) {
  // Security pre-flight check
  try {
    sanitizeStudentCode(studentCode);
  } catch (secError) {
    return {
      verdict: 'Security Error',
      status: 'Security Error',
      error: secError.message,
      results: [],
      totalTestCases: testCases.length,
      passedTestCases: 0
    };
  }

  const driverHarness = DriverGeneratorService.generateDriverHarness(
    'python',
    studentCode,
    functionDefinition,
    executionProfile,
    testCases
  );

  // Total child process timeout must allow enough time for python startup + evaluating ALL test cases
  const totalProcessTimeout = Math.max(8000, (timeLimitMs || 2000) * (testCases.length || 1));

  return new Promise((resolve) => {
    let timedOut = false;
    const pyProcess = spawn('python3', ['-c', driverHarness], {
      timeout: totalProcessTimeout,
      maxBuffer: 10 * 1024 * 1024
    });

    const timeoutTimer = setTimeout(() => {
      timedOut = true;
      try {
        pyProcess.kill('SIGKILL');
      } catch (e) {}
    }, totalProcessTimeout);

    let stdout = '';
    let stderr = '';

    pyProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pyProcess.on('error', (err) => {
      clearTimeout(timeoutTimer);
      if (timedOut || err.code === 'ETIMEDOUT') {
        return resolve({
          verdict: 'Time Limit Exceeded',
          status: 'Time Limit Exceeded',
          error: `Execution timed out exceeding ${timeLimitMs}ms limit.`,
          results: [],
          totalTestCases: testCases.length,
          passedTestCases: 0
        });
      }

      resolve({
        verdict: 'Runtime Error',
        status: 'Runtime Error',
        error: err.message,
        results: [],
        totalTestCases: testCases.length,
        passedTestCases: 0
      });
    });

    pyProcess.on('close', (code, signal) => {
      clearTimeout(timeoutTimer);

      if (timedOut || signal === 'SIGTERM' || signal === 'SIGKILL' || code === 143) {
        return resolve({
          verdict: 'Time Limit Exceeded',
          status: 'Time Limit Exceeded',
          error: `Execution timed out exceeding ${timeLimitMs}ms limit.`,
          results: [],
          totalTestCases: testCases.length,
          passedTestCases: 0
        });
      }
      if (code !== 0 && !stdout.includes('__SARTHI_JUDGE_OUTPUT_START__')) {
        return resolve({
          verdict: 'Runtime Error',
          status: 'Runtime Error',
          error: stderr || `Python process exited with error code ${code}`,
          results: [],
          totalTestCases: testCases.length,
          passedTestCases: 0
        });
      }

      // Extract JSON payload from stdout
      const startMarker = '__SARTHI_JUDGE_OUTPUT_START__';
      const endMarker = '__SARTHI_JUDGE_OUTPUT_END__';

      const startIndex = stdout.indexOf(startMarker);
      const endIndex = stdout.indexOf(endMarker);

      if (startIndex === -1 || endIndex === -1) {
        return resolve({
          verdict: 'Runtime Error',
          status: 'Runtime Error',
          error: stderr || 'Failed to extract execution output report.',
          results: [],
          totalTestCases: testCases.length,
          passedTestCases: 0
        });
      }

      const jsonStr = stdout.substring(startIndex + startMarker.length, endIndex).trim();
      let rawReport = [];
      try {
        rawReport = JSON.parse(jsonStr);
      } catch (err) {
        return resolve({
          verdict: 'Runtime Error',
          status: 'Runtime Error',
          error: `JSON Output Parse Error: ${err.message}`,
          results: [],
          totalTestCases: testCases.length,
          passedTestCases: 0
        });
      }

      // Evaluate each testcase output against expected output using ComparatorRegistry
      let passedCount = 0;
      let overallVerdict = 'Accepted';
      let totalExecutionTimeMs = 0;

      const results = rawReport.map((item, idx) => {
        const tc = testCases[idx] || {};
        const expected = ComparatorRegistry.normalizeValue(tc.expectedOutput);
        totalExecutionTimeMs += item.executionTimeMs || 0;

        if (!item.success) {
          if (overallVerdict === 'Accepted') overallVerdict = 'Runtime Error';
          return {
            testCaseIndex: idx + 1,
            passed: false,
            input: tc.input,
            actualOutput: null,
            expectedOutput: expected,
            error: item.error || 'Execution failed',
            executionTimeMs: item.executionTimeMs || 0
          };
        }

        const compResult = ComparatorRegistry.compareOutput(
          executionProfile?.comparator || 'ExactMatch',
          item.actualOutput,
          tc.expectedOutput
        );

        const isMatch = Boolean(compResult && (compResult.pass || compResult.match));

        if (isMatch) {
          passedCount++;
          return {
            testCaseIndex: idx + 1,
            passed: true,
            input: tc.input,
            actualOutput: item.actualOutput,
            expectedOutput: expected,
            executionTimeMs: item.executionTimeMs || 0
          };
        }

        if (overallVerdict === 'Accepted') overallVerdict = 'Wrong Answer';

        return {
          testCaseIndex: idx + 1,
          passed: false,
          input: tc.input,
          actualOutput: item.actualOutput,
          expectedOutput: expected,
          message: compResult.message || `Expected ${JSON.stringify(expected)}, received ${JSON.stringify(item.actualOutput)}`,
          executionTimeMs: item.executionTimeMs || 0
        };
      });

      const firstErr = results.find(r => r.error)?.error;

      resolve({
        verdict: overallVerdict,
        status: overallVerdict,
        error: overallVerdict !== 'Accepted' ? (firstErr || `Execution failed with verdict: ${overallVerdict}`) : undefined,
        totalTestCases: testCases.length,
        passedTestCases: passedCount,
        executionTimeMs: Math.round(totalExecutionTimeMs),
        results
      });
    });
  });
}
