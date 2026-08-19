import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { createProcessExecutionResult } from './ProcessErrors.js';

export const HARD_MAX_TIMEOUT_MS = 15000;
export const DEFAULT_OUTPUT_LIMIT_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Cross-platform process tree killer.
 */
export function killProcessTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /T /PID ${pid} >nul 2>&1`);
    } else {
      try {
        process.kill(-pid, 'SIGKILL');
      } catch (e) {
        process.kill(pid, 'SIGKILL');
      }
    }
  } catch (e) {
    // Process may have already exited
  }
}

/**
 * Checks if a binary command is executable on the host system.
 */
export function isCommandAvailable(command) {
  try {
    execSync(`${command} --version`, { stdio: 'pipe', windowsHide: true });
    return true;
  } catch (e) {
    return false;
  }
}

export class RuntimeProcessExecutor {
  /**
   * Executes a generated driver source in an isolated child process.
   * 
   * @param {Object} params
   * @param {string} params.language Target language ('python', 'javascript', 'cpp', 'java')
   * @param {string} params.sourceCode Generated driver harness source code
   * @param {number} params.timeLimitMs Per-testcase execution timeout (default: 2000ms)
   * @param {number} params.testCasesCount Total testcase count for scaling (default: 1)
   * @param {number} params.compileTimeoutMs Compilation timeout for C++/Java (default: 5000ms)
   * @param {number} params.maxOutputBytes Max bytes for stdout/stderr (default: 2 MB)
   * @returns {Promise<Object>} ProcessExecutionResult
   */
  static async executeProgram({
    language,
    sourceCode,
    timeLimitMs = 2000,
    testCasesCount = 1,
    compileTimeoutMs = 5000,
    maxOutputBytes = DEFAULT_OUTPUT_LIMIT_BYTES,
    maxMemoryMb = 256
  }) {
    const cleanLang = (language || '').toLowerCase().trim();
    const tempDir = path.join(os.tmpdir(), `sarthi_run_${crypto.randomUUID()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const totalTimeoutMs = Math.min(
      HARD_MAX_TIMEOUT_MS,
      Math.max(3000, (timeLimitMs || 2000) * (testCasesCount || 1))
    );

    const startTime = Date.now();

    try {
      if (cleanLang === 'javascript' || cleanLang === 'js' || cleanLang === 'node') {
        return await RuntimeProcessExecutor._executeNode({
          sourceCode,
          tempDir,
          totalTimeoutMs,
          maxOutputBytes,
          maxMemoryMb,
          startTime
        });
      } else if (cleanLang === 'python' || cleanLang === 'python3' || cleanLang === 'py') {
        return await RuntimeProcessExecutor._executePython({
          sourceCode,
          tempDir,
          totalTimeoutMs,
          maxOutputBytes,
          startTime
        });
      } else if (cleanLang === 'cpp' || cleanLang === 'c++' || cleanLang === 'cplusplus') {
        return await RuntimeProcessExecutor._executeCpp({
          sourceCode,
          tempDir,
          compileTimeoutMs,
          totalTimeoutMs,
          maxOutputBytes,
          startTime
        });
      } else if (cleanLang === 'java') {
        return await RuntimeProcessExecutor._executeJava({
          sourceCode,
          tempDir,
          compileTimeoutMs,
          totalTimeoutMs,
          maxOutputBytes,
          startTime
        });
      } else {
        return createProcessExecutionResult({
          status: 'PROCESS_ERROR',
          error: `Unsupported language for execution: '${language}'`
        });
      }
    } finally {
      // Guaranteed Workspace Cleanup
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {}
    }
  }

  // ---------------------------------------------------------------------------
  // 1. JavaScript (Node.js) Execution
  // ---------------------------------------------------------------------------
  static async _executeNode({ sourceCode, tempDir, totalTimeoutMs, maxOutputBytes, maxMemoryMb = 256, startTime }) {
    const filePath = path.join(tempDir, 'solution.js');
    fs.writeFileSync(filePath, sourceCode, 'utf8');

    return RuntimeProcessExecutor._runProcess({
      cmd: process.execPath || 'node',
      args: [`--max-old-space-size=${maxMemoryMb}`, filePath],
      cwd: tempDir,
      totalTimeoutMs,
      maxOutputBytes,
      startTime
    });
  }

  // ---------------------------------------------------------------------------
  // 2. Python Execution
  // ---------------------------------------------------------------------------
  static _resolvePythonCommand() {
    const candidates = [
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python312', 'python.exe'),
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'python.exe'),
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python310', 'python.exe'),
      'C:\\Program Files\\Python312\\python.exe',
      'C:\\Program Files\\Python311\\python.exe',
      'C:\\Program Files\\Python310\\python.exe',
      'python3',
      'python',
      'py'
    ];

    for (const cand of candidates) {
      if (cand.includes(path.sep) && fs.existsSync(cand)) {
        try {
          execSync(`"${cand}" --version`, { stdio: 'pipe', windowsHide: true });
          return cand;
        } catch (e) {}
      } else if (isCommandAvailable(cand)) {
        return cand;
      }
    }
    return null;
  }

  static async _executePython({ sourceCode, tempDir, totalTimeoutMs, maxOutputBytes, startTime }) {
    const filePath = path.join(tempDir, 'solution.py');
    fs.writeFileSync(filePath, sourceCode, 'utf8');

    const pyCmd = RuntimeProcessExecutor._resolvePythonCommand();

    if (!pyCmd) {
      return createProcessExecutionResult({
        status: 'PROCESS_ERROR',
        error: 'Python runtime (python3/python) is not available in the host environment.'
      });
    }

    return RuntimeProcessExecutor._runProcess({
      cmd: pyCmd,
      args: [filePath],
      cwd: tempDir,
      totalTimeoutMs,
      maxOutputBytes,
      startTime
    });
  }

  // ---------------------------------------------------------------------------
  // 3. C++ Compilation & Execution
  // ---------------------------------------------------------------------------
  static async _executeCpp({ sourceCode, tempDir, compileTimeoutMs, totalTimeoutMs, maxOutputBytes, startTime }) {
    const srcPath = path.join(tempDir, 'solution.cpp');
    const exeName = process.platform === 'win32' ? 'solution.exe' : 'solution.out';
    const exePath = path.join(tempDir, exeName);
    fs.writeFileSync(srcPath, sourceCode, 'utf8');

    if (!isCommandAvailable('g++')) {
      return createProcessExecutionResult({
        status: 'PROCESS_ERROR',
        error: 'g++ compiler is not available in the host environment.'
      });
    }

    // Step 1: Compilation
    const compileRes = await RuntimeProcessExecutor._runCompilation({
      cmd: 'g++',
      args: ['-O2', '-std=c++17', srcPath, '-o', exePath],
      cwd: tempDir,
      timeoutMs: compileTimeoutMs
    });

    if (compileRes.status !== 'SUCCESS') {
      return compileRes;
    }

    // Step 2: Execution
    return RuntimeProcessExecutor._runProcess({
      cmd: exePath,
      args: [],
      cwd: tempDir,
      totalTimeoutMs,
      maxOutputBytes,
      startTime
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Java Compilation & Execution
  // ---------------------------------------------------------------------------
  static async _executeJava({ sourceCode, tempDir, compileTimeoutMs, totalTimeoutMs, maxOutputBytes, startTime }) {
    const srcPath = path.join(tempDir, 'Main.java');
    fs.writeFileSync(srcPath, sourceCode, 'utf8');

    if (!isCommandAvailable('javac') || !isCommandAvailable('java')) {
      return createProcessExecutionResult({
        status: 'PROCESS_ERROR',
        error: 'JDK (javac/java) is not available in the host environment.'
      });
    }

    // Step 1: Compilation
    const compileRes = await RuntimeProcessExecutor._runCompilation({
      cmd: 'javac',
      args: [srcPath],
      cwd: tempDir,
      timeoutMs: compileTimeoutMs
    });

    if (compileRes.status !== 'SUCCESS') {
      return compileRes;
    }

    // Step 2: Execution
    return RuntimeProcessExecutor._runProcess({
      cmd: 'java',
      args: ['-cp', tempDir, '-Xss64m', 'Main'],
      cwd: tempDir,
      totalTimeoutMs,
      maxOutputBytes,
      startTime
    });
  }

  // ---------------------------------------------------------------------------
  // Helper: Run Compilation Step
  // ---------------------------------------------------------------------------
  static _runCompilation({ cmd, args, cwd, timeoutMs }) {
    return new Promise((resolve) => {
      let stderr = '';
      let stdout = '';
      let timedOut = false;

      const child = spawn(cmd, args, { cwd, windowsHide: true });

      const timer = setTimeout(() => {
        timedOut = true;
        killProcessTree(child.pid);
      }, timeoutMs);

      child.stdout.on('data', (d) => { stdout += d.toString(); });
      child.stderr.on('data', (d) => { stderr += d.toString(); });

      child.on('error', (err) => {
        clearTimeout(timer);
        resolve(createProcessExecutionResult({
          status: 'COMPILE_ERROR',
          error: `Compiler spawn failed: ${err.message}`,
          stderr
        }));
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (timedOut) {
          return resolve(createProcessExecutionResult({
            status: 'COMPILE_ERROR',
            error: `Compilation timed out exceeding ${timeoutMs}ms limit.`,
            stderr
          }));
        }

        if (code !== 0) {
          return resolve(createProcessExecutionResult({
            status: 'COMPILE_ERROR',
            exitCode: code,
            error: stderr || stdout || `Compiler exited with code ${code}`,
            stderr,
            stdout
          }));
        }

        resolve(createProcessExecutionResult({
          status: 'SUCCESS',
          exitCode: 0,
          stdout,
          stderr
        }));
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Helper: Run Process with Stream Monitoring & Timeouts
  // ---------------------------------------------------------------------------
  static _runProcess({ cmd, args, cwd, totalTimeoutMs, maxOutputBytes, startTime }) {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let totalBytes = 0;
      let timedOut = false;
      let outputLimitExceeded = false;

      const child = spawn(cmd, args, { cwd, windowsHide: true, detached: process.platform !== 'win32' });

      const timer = setTimeout(() => {
        timedOut = true;
        killProcessTree(child.pid);
      }, totalTimeoutMs);

      child.stdout.on('data', (chunk) => {
        const str = chunk.toString();
        totalBytes += chunk.length;
        stdout += str;

        if (totalBytes > maxOutputBytes && !outputLimitExceeded) {
          outputLimitExceeded = true;
          killProcessTree(child.pid);
        }
      });

      child.stderr.on('data', (chunk) => {
        const str = chunk.toString();
        totalBytes += chunk.length;
        stderr += str;

        if (totalBytes > maxOutputBytes && !outputLimitExceeded) {
          outputLimitExceeded = true;
          killProcessTree(child.pid);
        }
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        const executionTimeMs = Date.now() - startTime;
        resolve(createProcessExecutionResult({
          status: 'PROCESS_ERROR',
          error: `Process error: ${err.message}`,
          executionTimeMs,
          stderr,
          stdout
        }));
      });

      child.on('close', (code, signal) => {
        clearTimeout(timer);
        const executionTimeMs = Date.now() - startTime;

        if (timedOut) {
          return resolve(createProcessExecutionResult({
            status: 'TIME_LIMIT_EXCEEDED',
            error: `Execution timed out exceeding ${totalTimeoutMs}ms limit.`,
            executionTimeMs,
            stdout,
            stderr
          }));
        }

        if (outputLimitExceeded) {
          return resolve(createProcessExecutionResult({
            status: 'OUTPUT_LIMIT_EXCEEDED',
            error: `Output exceeded maximum allowed buffer limit (${maxOutputBytes} bytes).`,
            executionTimeMs,
            stdout,
            stderr
          }));
        }

        // Try to parse the Execution Result Envelope from stdout
        const envelope = RuntimeProcessExecutor._parseResultEnvelope(stdout);

        if (envelope) {
          if (envelope.status === 'RUNTIME_ERROR') {
            return resolve(createProcessExecutionResult({
              status: 'RUNTIME_ERROR',
              exitCode: code || 0,
              executionTimeMs,
              stdout,
              stderr,
              envelope,
              error: envelope.message || 'Runtime Exception'
            }));
          }

          return resolve(createProcessExecutionResult({
            status: 'SUCCESS',
            exitCode: code || 0,
            executionTimeMs,
            stdout,
            stderr,
            envelope
          }));
        }

        // If no structured envelope was produced and exit code was non-zero
        if (code !== 0) {
          const isSyntax = stderr.includes('SyntaxError') || 
                           stdout.includes('SyntaxError') || 
                           stderr.includes('IndentationError') || 
                           stderr.includes('TabError');
          return resolve(createProcessExecutionResult({
            status: isSyntax ? 'SYNTAX_ERROR' : 'RUNTIME_ERROR',
            exitCode: code,
            executionTimeMs,
            stdout,
            stderr,
            error: stderr || stdout || `Process exited with code ${code}`
          }));
        }

        // Fallback: If exit code is 0 but no envelope was produced
        resolve(createProcessExecutionResult({
          status: 'RUNTIME_ERROR',
          exitCode: 0,
          executionTimeMs,
          stdout,
          stderr,
          error: stderr || stdout || 'Program exited without returning valid structured output.'
        }));
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Helper: Extract and Parse Result Envelope from stdout
  // ---------------------------------------------------------------------------
  static _parseResultEnvelope(stdout) {
    if (!stdout || typeof stdout !== 'string') return null;

    const lines = stdout.trim().split(/\r?\n/);
    // Search in reverse for the last valid JSON envelope emitted by driver
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if ((line.startsWith('{') && line.endsWith('}')) && (line.includes('"status"') || line.includes("'status'"))) {
        try {
          const parsed = JSON.parse(line);
          if (parsed && (parsed.status === 'SUCCESS' || parsed.status === 'RUNTIME_ERROR')) {
            return parsed;
          }
        } catch (e) {}
      }
    }
    return null;
  }
}
