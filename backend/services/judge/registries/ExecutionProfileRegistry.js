/**
 * ExecutionProfileRegistry.js (Backend)
 * Registry for backend judge execution models (FUNCTION, CLASS_DESIGN, STDIO, SQL).
 */

class BackendExecutionProfileRegistryManager {
  constructor() {
    this.profiles = new Map();
  }

  register(profile) {
    if (!profile || !profile.id) {
      console.error('[BackendExecutionProfileRegistry] Invalid profile registered', profile);
      return;
    }
    this.profiles.set(profile.id.toUpperCase(), profile);
  }

  get(id) {
    if (!id || typeof id !== 'string') {
      return this.profiles.get('FUNCTION');
    }
    return this.profiles.get(id.toUpperCase()) || this.profiles.get('FUNCTION');
  }

  getAll() {
    return Array.from(this.profiles.values());
  }
}

export const BackendExecutionProfileRegistry = new BackendExecutionProfileRegistryManager();
