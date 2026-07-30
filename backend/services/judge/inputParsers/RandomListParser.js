/**
 * RandomListParser - Parser for Linked Lists with Random Pointers
 * Parses raw input strings / arrays into pair arrays [[val, random_index], ...]
 */
export class RandomListParser {
  static parse(rawValue) {
    if (rawValue === null || rawValue === undefined) return null;
    let data = rawValue;

    if (typeof rawValue === 'string') {
      try {
        data = JSON.parse(rawValue);
      } catch (e) {
        return rawValue;
      }
    }

    if (!Array.isArray(data)) return data;

    return data.map(pair => {
      if (!Array.isArray(pair)) return pair;
      const val = Number(pair[0]);
      const rand = pair[1] === null || pair[1] === undefined ? null : Number(pair[1]);
      return [val, rand];
    });
  }
}
