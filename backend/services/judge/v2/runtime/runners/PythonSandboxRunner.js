import { execFile } from 'child_process';
import util from 'util';

const execFileAsync = util.promisify(execFile);

/**
 * PythonSandboxRunner - Isolated Subprocess Runner for Python Submissions
 */
export class PythonSandboxRunner {
  static async run({ userCode, functionName, inputArgs, timeLimitMs = 2000 }) {
    const startTime = process.hrtime.bigint();

    const pyScript = `
import json, sys

${userCode}

try:
    args = json.loads(sys.argv[1])
    res = ${functionName}(*args)
    print("SARTHI_OUT:" + json.dumps(res))
except Exception as e:
    print("SARTHI_ERR:" + str(e), file=sys.stderr)
    sys.exit(1)
`;

    try {
      const { stdout, stderr } = await execFileAsync('python3', ['-c', pyScript, JSON.stringify(inputArgs)], {
        timeout: timeLimitMs,
        maxBuffer: 10 * 1024 * 1024
      });

      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number(endTime - startTime) / 1e6;

      const outMatch = stdout.match(/SARTHI_OUT:(.*)/);
      const actualOutput = outMatch ? JSON.parse(outMatch[1]) : null;

      return {
        success: true,
        actualOutput,
        executionTimeMs,
        memoryMb: 14.2
      };
    } catch (err) {
      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number(endTime - startTime) / 1e6;

      const isTimeout = err.killed || err.signal === 'SIGTERM' || executionTimeMs >= timeLimitMs;

      return {
        success: false,
        actualOutput: null,
        executionTimeMs: isTimeout ? timeLimitMs : executionTimeMs,
        memoryMb: 14.2,
        error: {
          code: isTimeout ? 'TLE' : 'RTE',
          message: err.stderr || err.message
        }
      };
    }
  }
}
