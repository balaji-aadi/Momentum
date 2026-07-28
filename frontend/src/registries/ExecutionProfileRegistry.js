/**
 * ExecutionProfileRegistry.js (Frontend)
 * Registry for problem execution models (FUNCTION, CLASS_DESIGN, STDIO, SQL).
 * Future execution profiles register here without modifying core CMS pages or arena views.
 */

import { FunctionExecutionProfile } from './profiles/FunctionExecutionProfile';

class ExecutionProfileRegistryManager {
  constructor() {
    this.profiles = new Map();
    this.register(FunctionExecutionProfile);
  }

  register(profile) {
    if (!profile || !profile.id) {
      console.error('[ExecutionProfileRegistry] Invalid profile object registered', profile);
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

export const ExecutionProfileRegistry = new ExecutionProfileRegistryManager();
