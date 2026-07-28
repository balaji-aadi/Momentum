/**
 * Ordered Array Match Comparator
 * Performs strict index-by-index equality comparison for 1D and 2D arrays.
 */

export class OrderedArrayMatch {
  static compare(actual, expected) {
    let normActual = actual;
    let normExpected = expected;

    if (typeof normActual === 'string') {
      try { normActual = JSON.parse(normActual.trim()); } catch (e) {}
    }
    if (typeof normExpected === 'string') {
      try { normExpected = JSON.parse(normExpected.trim()); } catch (e) {}
    }

    const jsonActual = JSON.stringify(normActual);
    const jsonExpected = JSON.stringify(normExpected);

    if (jsonActual === jsonExpected) {
      return { match: true };
    }

    return {
      match: false,
      message: `Array mismatch. Expected ${jsonExpected}, received ${jsonActual}`
    };
  }
}
