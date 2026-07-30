/**
 * DataTypeRegistry.js
 * Centralized, pluggable registry for all problem parameter data types.
 * Adding a new data type (e.g. Interval, TrieNode) requires registering 1 plugin file
 * without modifying any UI component (TestCaseCard, OutputConsolePanel, etc.).
 */

import { PrimitiveNumberType, PrimitiveStringType, PrimitiveBooleanType } from './types/PrimitiveType';
import { ArrayNumberType, ArrayStringType } from './types/ArrayType';
import { MatrixType } from './types/MatrixType';
import { LinkedListType } from './types/LinkedListType';
import { RandomListNodeType } from './types/RandomListNodeType';
import { BinaryTreeType } from './types/BinaryTreeType';
import { GraphType } from './types/GraphType';
import { FallbackType } from './types/FallbackType';

class DataTypeRegistryManager {
  constructor() {
    this.plugins = new Map();

    // Auto-register built-in type plugins
    this.register(PrimitiveNumberType);
    this.register(PrimitiveStringType);
    this.register(PrimitiveBooleanType);
    this.register(ArrayNumberType);
    this.register(ArrayStringType);
    this.register(MatrixType);
    this.register(LinkedListType);
    this.register(RandomListNodeType);
    this.register(BinaryTreeType);
    this.register(GraphType);
    this.register(FallbackType);
  }

  /**
   * Register a new Data Type Plugin.
   * @param {Object} plugin Plugin contract object
   */
  register(plugin) {
    if (!plugin || !plugin.id) {
      console.error('[DataTypeRegistry] Invalid plugin object registered', plugin);
      return;
    }
    this.plugins.set(plugin.id.toLowerCase(), plugin);
    if (Array.isArray(plugin.aliases)) {
      plugin.aliases.forEach(alias => this.plugins.set(alias.toLowerCase(), plugin));
    }
  }

  /**
   * Get plugin by data type name. Returns FallbackType if type is unregistered.
   * @param {string} type 
   */
  get(type) {
    if (!type || typeof type !== 'string') {
      return this.plugins.get('fallback');
    }
    const cleanType = type.toLowerCase().trim();
    return this.plugins.get(cleanType) || this.plugins.get('fallback');
  }

  /**
   * Returns list of all registered data type plugins.
   */
  getAll() {
    return Array.from(new Set(this.plugins.values()));
  }
}

export const DataTypeRegistry = new DataTypeRegistryManager();
