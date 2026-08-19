/**
 * 1D / 2D Array & Matrix Output Serializer (Phase 4)
 * Converts native array results into canonical JSON array representations.
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
