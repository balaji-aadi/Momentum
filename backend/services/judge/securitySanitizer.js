/**
 * Code Security Sanitizer & Static Guard
 * Protects server infrastructure against malicious code execution and illegal system access.
 */

const FORBIDDEN_PATTERNS = [
  /import\s+os\b/,
  /import\s+subprocess\b/,
  /import\s+sys\b/,
  /import\s+socket\b/,
  /import\s+shutil\b/,
  /import\s+importlib\b/,
  /from\s+os\b/,
  /from\s+subprocess\b/,
  /from\s+sys\b/,
  /\beval\s*\(/,
  /\bexec\s*\(/,
  /\bopen\s*\(/,
  /__import__\s*\(/
];

export function sanitizeStudentCode(code) {
  if (!code || typeof code !== 'string') return;

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      throw new Error(`Security Error: Restricted system module or operation detected matching ${pattern.toString()}`);
    }
  }
}
