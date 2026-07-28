/**
 * Exact Match Comparator
 * Performs strict primitive equality comparison (numbers, booleans, strings, arrays, objects).
 */

export class ExactMatch {
  static compare(actual, expected) {
    if (actual === expected) {
      return { match: true };
    }

    let normActual = actual;
    let normExpected = expected;

    if (typeof normActual === 'string') {
      const trimmed = normActual.trim();
      if (
        (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        trimmed === 'true' ||
        trimmed === 'false' ||
        (!isNaN(trimmed) && trimmed !== '')
      ) {
        try { normActual = JSON.parse(trimmed); } catch (e) {}
      }
    }

    if (typeof normExpected === 'string') {
      const trimmed = normExpected.trim();
      if (
        (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        trimmed === 'true' ||
        trimmed === 'false' ||
        (!isNaN(trimmed) && trimmed !== '')
      ) {
        try { normExpected = JSON.parse(trimmed); } catch (e) {}
      }
    }

    if (normActual === normExpected) {
      return { match: true };
    }

    if (JSON.stringify(normActual) === JSON.stringify(normExpected)) {
      return { match: true };
    }

    if (String(normActual).trim() === String(normExpected).trim()) {
      return { match: true };
    }

    return {
      match: false,
      message: `Expected ${JSON.stringify(normExpected)}, received ${JSON.stringify(normActual)}`
    };
  }
}
