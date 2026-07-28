import { PrimitiveParser } from './PrimitiveParser.js';
import { ArrayParser } from './ArrayParser.js';
import { MatrixParser } from './MatrixParser.js';
import { LinkedListParser } from './LinkedListParser.js';
import { BinaryTreeParser } from './BinaryTreeParser.js';
import { GraphParser } from './GraphParser.js';

export const PARSER_REGISTRY = {
  PrimitiveParser,
  ArrayParser,
  MatrixParser,
  LinkedListParser,
  BinaryTreeParser,
  GraphParser,
  
  // Aliases for user profiles
  primitive: PrimitiveParser,
  array: ArrayParser,
  matrix: MatrixParser,
  'linked-list': LinkedListParser,
  'binary-tree': BinaryTreeParser,
  graph: GraphParser
};

export class InputParserRegistry {
  static parseInput(parserName, rawValue, targetType) {
    const parser = PARSER_REGISTRY[parserName] || ArrayParser;
    return parser.parse(rawValue, targetType);
  }
}
