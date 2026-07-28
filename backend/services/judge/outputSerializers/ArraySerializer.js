/**
 * 1D / 2D Array Output Serializer
 * Converts native arrays into canonical JSON array representations.
 */

export class ArraySerializer {
  static serialize(val) {
    if (val === null || val === undefined) return [];
    if (!Array.isArray(val)) return [val];

    return val.map(item => {
      if (Array.isArray(item)) {
        return ArraySerializer.serialize(item);
      }
      return item;
    });
  }
}
