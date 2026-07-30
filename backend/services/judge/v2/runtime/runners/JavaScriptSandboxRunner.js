import vm from 'vm';

/**
 * JavaScriptSandboxRunner - Isolated Node.js VM Context Execution Runner
 */
export class JavaScriptSandboxRunner {
  static async run({ userCode, functionName, inputArgs, timeLimitMs = 2000 }) {
    const startTime = process.hrtime.bigint();

    try {
      // Build VM sandbox context
      const sandbox = {
        console: { log: () => {}, error: () => {} },
        Math,
        Array,
        Object,
        Map,
        Set,
        String,
        Number,
        Boolean,
        JSON
      };

      const context = vm.createContext(sandbox);

      // Wrapper script executing user code and function entrypoint
      const script = new vm.Script(`
        ${userCode}
        const __result = ${functionName}(...${JSON.stringify(inputArgs)});
        __result;
      `);

      const actualOutput = script.runInContext(context, { timeout: timeLimitMs });
      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number(endTime - startTime) / 1e6;

      return {
        success: true,
        actualOutput,
        executionTimeMs,
        memoryMb: 12.5
      };
    } catch (err) {
      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number(endTime - startTime) / 1e6;

      const isTimeout = err.message.includes('Script execution timed out') || executionTimeMs >= timeLimitMs;

      return {
        success: false,
        actualOutput: null,
        executionTimeMs: isTimeout ? timeLimitMs : executionTimeMs,
        memoryMb: 12.5,
        error: {
          code: isTimeout ? 'TLE' : 'RTE',
          message: err.message
        }
      };
    }
  }
}
