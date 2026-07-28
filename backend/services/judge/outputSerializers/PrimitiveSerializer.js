/**
 * Primitive Output Serializer
 * Converts primitive numbers, booleans, and strings to canonical JSON values.
 */

export class PrimitiveSerializer {
  static serialize(val) {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number' && isNaN(val)) return null;
    return val;
  }
}
