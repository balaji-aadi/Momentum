/**
 * CustomTypeRegistry - Declarative Registry for Complex LeetCode Custom Structures
 * Provides schema definitions, serialization formats, pointer mapping rules,
 * and multi-language class definitions for non-primitive types (e.g. RandomListNode, GraphNode).
 */
export class CustomTypeRegistry {
  static types = new Map();

  /**
   * Registers a custom data structure schema.
   * @param {Object} schema
   */
  static registerType(schema) {
    if (!schema || !schema.id) {
      throw new Error("CustomTypeRegistry: Schema must contain a valid id.");
    }
    this.types.set(schema.id, schema);
    if (schema.aliases && Array.isArray(schema.aliases)) {
      schema.aliases.forEach(alias => this.types.set(alias, schema));
    }
  }

  /**
   * Retrieves a custom type schema by ID or alias.
   * @param {string} id
   * @returns {Object|null}
   */
  static getType(id) {
    if (!id) return null;
    return this.types.get(id) || this.types.get(id.toLowerCase()) || null;
  }

  /**
   * Returns all registered custom type IDs.
   * @returns {string[]}
   */
  static listTypes() {
    return Array.from(this.types.keys());
  }

  /**
   * Initialises standard built-in LeetCode custom schemas.
   */
  static initDefaults() {
    if (this.types.has('random_list_node')) return;

    // Register random_list_node schema for LeetCode #138 (Copy List with Random Pointer)
    this.registerType({
      id: 'random_list_node',
      aliases: ['RandomListNode', 'RandomList', 'NodeWithRandom'],
      label: 'Random List Node (val, next, random)',
      className: 'Node',
      serializationFormat: 'pair_array', // [[val, random_index], ...]
      fields: [
        { name: 'val', type: 'integer' },
        { name: 'next', type: 'pointer', target: 'self', relation: 'singly_linked' },
        { name: 'random', type: 'pointer', target: 'self', relation: 'index_reference', nullable: true }
      ],
      classHeaders: {
        python: `class Node:
    def __init__(self, x: int, next: 'Node' = None, random: 'Node' = None):
        self.val = int(x)
        self.next = next
        self.random = random`,

        javascript: `function Node(val, next, random) {
  this.val = val === undefined ? 0 : val;
  this.next = next === undefined ? null : next;
  this.random = random === undefined ? null : random;
}`,

        cpp: `class Node {
public:
    int val;
    Node* next;
    Node* random;
    Node(int _val) {
        val = _val;
        next = NULL;
        random = NULL;
    }
};`,

        java: `class Node {
    int val;
    Node next;
    Node random;

    public Node(int val) {
        this.val = val;
        this.next = null;
        this.random = null;
    }
}`
      }
    });
  }
}

// Auto-initialize default built-in schemas
CustomTypeRegistry.initDefaults();
