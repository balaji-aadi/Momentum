/**
 * Unordered Array Match Comparator
 * Order-insensitive array comparison (e.g., Two Sum returned index pair [0, 1] vs expected [1, 0], 3Sum triplets in any order).
 */

export class UnorderedArrayMatch {
  static compare(actual, expected) {
    let normActual = actual;
    let normExpected = expected;

    if (typeof normActual === 'string') {
      try { normActual = JSON.parse(normActual.trim()); } catch (e) {}
    }
    if (typeof normExpected === 'string') {
      try { normExpected = JSON.parse(normExpected.trim()); } catch (e) {}
    }

    if (normActual === null || normActual === undefined) {
      return { match: false, message: "Function returned None / null instead of array output." };
    }
    if (!Array.isArray(normActual) || !Array.isArray(normExpected)) {
      if (normActual === normExpected || JSON.stringify(normActual) === JSON.stringify(normExpected)) {
        return { match: true };
      }
      return { match: false, message: `Expected ${JSON.stringify(normExpected)}, received ${JSON.stringify(normActual)}` };
    }

    if (normActual.length !== normExpected.length) {
      return { match: false, message: `Length mismatch. Expected length ${normExpected.length}, received ${normActual.length}` };
    }

    // Clone and sort primitive arrays
    const sortedActual = [...normActual].map(item => Array.isArray(item) ? [...item].sort() : item).sort();
    const sortedExpected = [...normExpected].map(item => Array.isArray(item) ? [...item].sort() : item).sort();

    if (JSON.stringify(sortedActual) === JSON.stringify(sortedExpected)) {
      return { match: true };
    }

    return {
      match: false,
      message: `Unordered array mismatch. Expected ${JSON.stringify(normExpected)}, received ${JSON.stringify(normActual)}`
    };
  }
}
