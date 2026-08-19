/**
 * Primitive Output Serializer (Phase 4)
 * Converts numbers, booleans, strings, and null into canonical JSON values.
 */
export class PrimitiveSerializer {
  static serialize(val) {
    if (val === null || val === undefined) return null;

    if (typeof val === 'number') {
      if (isNaN(val) || !isFinite(val)) return null;
      return val;
    }

    if (typeof val === 'boolean') {
      return val;
    }

    if (typeof val === 'string') {
      return val;
    }

    return String(val);
  }
}
