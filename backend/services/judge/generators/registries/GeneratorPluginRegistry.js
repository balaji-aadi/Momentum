/**
 * Generic Generator & Plugin Registry
 * Holds registrations for Primitive Data Generators and Pattern Plugins.
 */
export class GeneratorPluginRegistry {
  static primitives = new Map();
  static plugins = new Map();

  /**
   * Registers a primitive data generator.
   */
  static registerPrimitive(key, generatorInstance) {
    if (!key || typeof key !== 'string') {
      throw new Error("Primitive registration requires a valid string key.");
    }
    this.primitives.set(key, generatorInstance);
  }

  /**
   * Retrieves a primitive data generator by key.
   */
  static getPrimitive(key) {
    return this.primitives.get(key) || null;
  }

  /**
   * Registers a reusable pattern plugin.
   */
  static registerPlugin(key, pluginInstance) {
    if (!key || typeof key !== 'string') {
      throw new Error("Plugin registration requires a valid string key.");
    }
    this.plugins.set(key, pluginInstance);
  }

  /**
   * Retrieves a pattern plugin by key.
   */
  static getPlugin(key) {
    return this.plugins.get(key) || null;
  }

  /**
   * Returns all registered primitive generators.
   */
  static listPrimitives() {
    return Array.from(this.primitives.keys());
  }

  /**
   * Returns all registered pattern plugins.
   */
  static listPlugins() {
    return Array.from(this.plugins.keys());
  }

  /**
   * Clears all registered entries (useful for unit tests).
   */
  static clearAll() {
    this.primitives.clear();
    this.plugins.clear();
  }
}
