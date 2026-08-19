import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { createProcessExecutionResult } from '../runners/ProcessErrors.js';
import { normalizeExecutionLimits } from './ExecutionLimits.js';

export const RUNTIME_IMAGES = {
  python: 'python:3.11-alpine',
  javascript: 'node:20-alpine',
  cpp: 'gcc:13-alpine',
  java: 'openjdk:17-alpine'
};

/**
 * Checks if Docker daemon is available and accessible.
 */
export function isDockerAvailable() {
  try {
    execSync('docker info', { stdio: 'pipe', windowsHide: true });
    return true;
  } catch (e) {
    return false;
  }
}

export class DockerSandboxExecutor {
  /**
   * Executes source code inside an isolated Docker container with strict cgroups & network isolation.
   * 
   * @param {Object} params
   * @param {string} params.language Target language ('python', 'javascript', 'cpp', 'java')
   * @param {string} params.sourceCode Generated driver harness source code
   * @param {Object} [params.executionLimits] Resource limits (time, memory, CPU, pids)
   * @param {number} [params.testCasesCount] Total testcase count
   * @returns {Promise<Object>} ProcessExecutionResult
   */
  static async execute({
    language,
    sourceCode,
    executionLimits = {},
    testCasesCount = 1
  }) {
    if (!isDockerAvailable()) {
      return createProcessExecutionResult({
        status: 'SANDBOX_UNAVAILABLE',
        error: 'Docker container sandbox is not available in the host environment.'
      });
    }

    const cleanLang = (language || '').toLowerCase().trim();
    const limits = normalizeExecutionLimits(executionLimits);
    const containerImage = RUNTIME_IMAGES[cleanLang];

    if (!containerImage) {
      return createProcessExecutionResult({
        status: 'PROCESS_ERROR',
        error: `Unsupported sandbox language: '${language}'`
      });
    }

    const tempDir = path.join(os.tmpdir(), `sarthi_sandbox_${crypto.randomUUID()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // Determine entry filename & container run command
    let fileName = '';
    let containerCommand = [];

    if (cleanLang === 'javascript') {
      fileName = 'solution.js';
      containerCommand = ['node', `/workspace/${fileName}`];
    } else if (cleanLang === 'python') {
      fileName = 'solution.py';
      containerCommand = ['python', `/workspace/${fileName}`];
    } else if (cleanLang === 'cpp') {
      fileName = 'solution.cpp';
      // Inside sandbox: compile then execute
      containerCommand = ['sh', '-c', 'g++ -O2 -std=c++17 /workspace/solution.cpp -o /tmp/solution.out && /tmp/solution.out'];
    } else if (cleanLang === 'java') {
      fileName = 'Main.java';
      // Inside sandbox: compile then execute
      containerCommand = ['sh', '-c', 'javac /workspace/Main.java -d /tmp && java -cp /tmp Main'];
    }

    fs.writeFileSync(path.join(tempDir, fileName), sourceCode, 'utf8');

    // Build Docker arguments
    const totalTimeoutMs = Math.min(
      15000,
      Math.max(3000, limits.timeLimitMs * testCasesCount)
    );

    const dockerArgs = [
      'run',
      '--rm',
      '--network', 'none', // Strictly disable network
      '--memory', `${limits.memoryLimitMb}m`, // Hard cgroup memory limit
      '--memory-swap', `${limits.memoryLimitMb}m`, // Disable swap expansion
      '--cpus', `${limits.cpuLimit}`, // CPU quota
      '--pids-limit', `${limits.processLimit}`, // Process / fork-bomb limit
      '--user', '1000:1000', // Non-root execution
      '--cap-drop', 'ALL', // Drop all Linux capabilities
      '--security-opt', 'no-new-privileges:true', // Prevent privilege escalation
      '--read-only', // Read-only root filesystem
      '--tmpfs', '/tmp:rw,noexec,nosuid,size=64m', // Isolated ephemeral tmpfs
      '-v', `${tempDir}:/workspace:ro`, // Read-only workspace mount for source
      '-w', '/workspace',
      containerImage,
      ...containerCommand
    ];

    const startTime = Date.now();

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let totalBytes = 0;
      let timedOut = false;
      let outputLimitExceeded = false;

      const child = spawn('docker', dockerArgs, { windowsHide: true });

      const timer = setTimeout(() => {
        timedOut = true;
        try { child.kill('SIGKILL'); } catch (e) {}
      }, totalTimeoutMs);

      child.stdout.on('data', (chunk) => {
        totalBytes += chunk.length;
        stdout += chunk.toString();
        if (totalBytes > limits.outputLimitBytes && !outputLimitExceeded) {
          outputLimitExceeded = true;
          try { child.kill('SIGKILL'); } catch (e) {}
        }
      });

      child.stderr.on('data', (chunk) => {
        totalBytes += chunk.length;
        stderr += chunk.toString();
        if (totalBytes > limits.outputLimitBytes && !outputLimitExceeded) {
          outputLimitExceeded = true;
          try { child.kill('SIGKILL'); } catch (e) {}
        }
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        const executionTimeMs = Date.now() - startTime;

        // Guaranteed cleanup of host temp dir
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}

        if (timedOut) {
          return resolve(createProcessExecutionResult({
            status: 'TIME_LIMIT_EXCEEDED',
            error: `Execution timed out exceeding ${totalTimeoutMs}ms sandbox limit.`,
            executionTimeMs,
            stdout,
            stderr
          }));
        }

        if (outputLimitExceeded) {
          return resolve(createProcessExecutionResult({
            status: 'OUTPUT_LIMIT_EXCEEDED',
            error: `Output exceeded maximum allowed buffer limit (${limits.outputLimitBytes} bytes).`,
            executionTimeMs,
            stdout,
            stderr
          }));
        }

        // Docker OOM Killer exit code is typically 137
        if (code === 137 && !timedOut) {
          return resolve(createProcessExecutionResult({
            status: 'MEMORY_LIMIT_EXCEEDED',
            error: `Process exceeded maximum memory limit of ${limits.memoryLimitMb}MB.`,
            executionTimeMs,
            stdout,
            stderr
          }));
        }

        // Parse result envelope
        const envelope = DockerSandboxExecutor._parseResultEnvelope(stdout);
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

        if (code !== 0) {
          const isCompile = stderr.includes('error:') || stderr.includes('javac');
          const isSyntax = stderr.includes('SyntaxError');
          return resolve(createProcessExecutionResult({
            status: isCompile ? 'COMPILE_ERROR' : (isSyntax ? 'SYNTAX_ERROR' : 'RUNTIME_ERROR'),
            exitCode: code,
            executionTimeMs,
            stdout,
            stderr,
            error: stderr || stdout || `Sandbox container exited with code ${code}`
          }));
        }

        resolve(createProcessExecutionResult({
          status: 'SUCCESS',
          exitCode: 0,
          executionTimeMs,
          stdout,
          stderr,
          envelope: { status: 'SUCCESS', results: [] }
        }));
      });
    });
  }

  static _parseResultEnvelope(stdout) {
    if (!stdout || typeof stdout !== 'string') return null;
    const lines = stdout.trim().split(/\r?\n/);
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
