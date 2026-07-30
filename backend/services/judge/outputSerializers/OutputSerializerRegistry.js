import { PrimitiveSerializer } from './PrimitiveSerializer.js';
import { ArraySerializer } from './ArraySerializer.js';
import { LinkedListSerializer } from './LinkedListSerializer.js';
import { BinaryTreeSerializer } from './BinaryTreeSerializer.js';
import { RandomListSerializer } from './RandomListSerializer.js';

export const SERIALIZER_REGISTRY = {
  PrimitiveSerializer,
  ArraySerializer,
  LinkedListSerializer,
  BinaryTreeSerializer,
  RandomListSerializer,

  // Aliases for user profiles
  primitive: PrimitiveSerializer,
  array: ArraySerializer,
  'linked-list': LinkedListSerializer,
  'binary-tree': BinaryTreeSerializer,
  'random-list': RandomListSerializer
};

export class OutputSerializerRegistry {
  static serializeOutput(serializerName, rawOutput) {
    const serializer = SERIALIZER_REGISTRY[serializerName] || ArraySerializer;
    return serializer.serialize(rawOutput);
  }
}
