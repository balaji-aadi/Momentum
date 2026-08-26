/**
 * JudgeLogger - Structured Context JSON Logger with Privacy Redaction
 * (Phase 12 Observability Module)
 * 
 * Emits single-line JSON log events containing correlation IDs, job state metadata,
 * and execution durations while strictly redacting student source code, connection URIs,
 * and security tokens.
 */
export class JudgeLogger {
  static SERVICE_NAME = 'sarthi-judge';

  static log(level, event, metadata = {}) {
    const sanitizedMeta = JudgeLogger.redactSensitiveData(metadata);
    const entry = {
      timestamp: new Date().toISOString(),
      level: (level || 'INFO').toUpperCase(),
      service: JudgeLogger.SERVICE_NAME,
      event: event || 'UNKNOWN_EVENT',
      correlationId: sanitizedMeta.correlationId || null,
      traceId: sanitizedMeta.traceId || null,
      jobId: sanitizedMeta.jobId || null,
      userId: sanitizedMeta.userId || null,
      problemId: sanitizedMeta.problemId || null,
      executionType: sanitizedMeta.executionType || null,
      language: sanitizedMeta.language || null,
      state: sanitizedMeta.state || null,
      durationMs: sanitizedMeta.durationMs !== undefined ? sanitizedMeta.durationMs : null,
      error: sanitizedMeta.error || null,
      ...sanitizedMeta.extra
    };

    // Clean null fields for compact JSON emission
    Object.keys(entry).forEach(k => entry[k] === null && delete entry[k]);
    const jsonString = JSON.stringify(entry);

    if (level === 'ERROR' || level === 'WARN') {
      console.error(jsonString);
    } else {
      console.log(jsonString);
    }
  }

  static info(event, metadata) {
    JudgeLogger.log('INFO', event, metadata);
  }

  static warn(event, metadata) {
    JudgeLogger.log('WARN', event, metadata);
  }

  static error(event, metadata) {
    JudgeLogger.log('ERROR', event, metadata);
  }

  static debug(event, metadata) {
    if (process.env.DEBUG_JUDGE) {
      JudgeLogger.log('DEBUG', event, metadata);
    }
  }

  /**
   * Redacts sensitive user source code, database URIs, and authentication tokens.
   */
  static redactSensitiveData(data) {
    if (!data || typeof data !== 'object') return {};
    const copy = { ...data };

    // Remove source code and sensitive keys
    delete copy.code;
    delete copy.studentCode;
    delete copy.sourceCode;
    delete copy.MONGO_URI;
    delete copy.REDIS_URL;
    delete copy.JWT_SECRET;

    if (copy.testCases && Array.isArray(copy.testCases)) {
      copy.testCasesCount = copy.testCases.length;
      delete copy.testCases;
    }

    if (typeof copy.error === 'object' && copy.error !== null) {
      copy.error = copy.error.message || String(copy.error);
    }

    return copy;
  }
}
