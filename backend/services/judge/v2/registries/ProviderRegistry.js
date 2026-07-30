/**
 * Sarthi Judge v2.0 - Capability-Driven Provider Registry
 * Dynamic discovery via `supports(ir) -> score`. Zero hardcoded mapping tables.
 */

export class ProviderRegistry {
  static providers = {
    SCHEMA: new Map(),
    GENERATOR: new Map(),
    PARSER: new Map(),
    SERIALIZER: new Map(),
    COMPARATOR: new Map(),
    VALIDATOR: new Map(),
    GRAMMAR: new Map()
  };

  /**
   * Registers a provider instance
   */
  static registerProvider(provider) {
    if (!provider || !provider.id || !provider.category) {
      throw new Error('Invalid provider: must possess id and category.');
    }
    const catMap = this.providers[provider.category];
    if (!catMap) {
      throw new Error(`Unknown provider category: ${provider.category}`);
    }
    catMap.set(provider.id, provider);
  }

  /**
   * Discovers the best provider for a given category and IR using capability scoring
   */
  static findBestProvider(category, ir) {
    const catMap = this.providers[category];
    if (!catMap || catMap.size === 0) return null;

    let bestProvider = null;
    let maxScore = 0.0;

    for (const provider of catMap.values()) {
      try {
        const score = provider.supports(ir);
        if (score > maxScore) {
          maxScore = score;
          bestProvider = provider;
        }
      } catch (err) {
        console.warn(`Provider capability evaluation error [${provider.id}]:`, err);
      }
    }

    return maxScore > 0.0 ? bestProvider : null;
  }

  /**
   * Gets a specific provider by ID and Category
   */
  static getProvider(category, providerId) {
    const catMap = this.providers[category];
    return catMap ? catMap.get(providerId) : null;
  }
}
