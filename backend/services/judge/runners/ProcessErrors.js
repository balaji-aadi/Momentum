/**
 * Runtime Process Execution Result & Error Definitions (Phase 7)
 */

export function createProcessExecutionResult({
  status = 'SUCCESS',
  exitCode = 0,
  executionTimeMs = 0,
  stdout = '',
  stderr = '',
  envelope = null,
  error = null
}) {
  return {
    status,
    exitCode,
    executionTimeMs,
    stdout,
    stderr,
    envelope,
    error
  };
}
