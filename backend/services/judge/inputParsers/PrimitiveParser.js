/**
 * Primitive Input Parser
 * Parses primitive values: numbers, booleans, and strings.
 */

export class PrimitiveParser {
  static parse(val, targetType = 'number') {
    if (val === null || val === undefined) return val;

    const cleanType = (targetType || '').toLowerCase().trim();

    if (cleanType === 'number' || cleanType === 'int' || cleanType === 'float') {
      const num = Number(val);
      if (isNaN(num)) throw new Error(`PrimitiveParser: Failed to parse '${val}' as number`);
      return num;
    }

    if (cleanType === 'boolean' || cleanType === 'bool') {
      if (typeof val === 'boolean') return val;
      if (val === 'true') return true;
      if (val === 'false') return false;
      return Boolean(val);
    }

    if (cleanType === 'string') {
      return String(val);
    }

    return val;
  }
}
