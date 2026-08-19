/**
 * Driver Harness Generation Errors (Phase 6)
 */

export class UnsupportedLanguageError extends Error {
  constructor(language) {
    super(`[UnsupportedLanguageError] Unsupported language for driver harness generation: '${language}'. Supported languages: 'python', 'javascript', 'cpp', 'java'.`);
    this.name = 'UnsupportedLanguageError';
    this.language = language;
  }
}

export class DriverGenerationError extends Error {
  constructor(message, details = {}) {
    super(`[DriverGenerationError] ${message}`);
    this.name = 'DriverGenerationError';
    this.details = details;
  }
}
