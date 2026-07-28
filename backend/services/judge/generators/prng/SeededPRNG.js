/**
 * SeededPRNG - Mulberry32 Deterministic Pseudo-Random Number Generator
 * Guarantees 100% reproducible random streams given an integer seed.
 */
export class SeededPRNG {
  constructor(seed = 133742) {
    this.initialSeed = seed;
    this.state = seed >>> 0;
  }

  /**
   * Resets the PRNG state back to the initial seed.
   */
  reset() {
    this.state = this.initialSeed >>> 0;
  }

  /**
   * Generates a float in range [0, 1)
   */
  nextFloat() {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates an integer in range [min, max] (inclusive)
   */
  nextInt(min, max) {
    if (min > max) {
      throw new Error(`Invalid int range: min (${min}) cannot exceed max (${max})`);
    }
    const float = this.nextFloat();
    return Math.floor(float * (max - min + 1)) + min;
  }

  /**
   * Generates a boolean with optional true probability [0, 1]
   */
  nextBool(probability = 0.5) {
    return this.nextFloat() < probability;
  }

  /**
   * Selects a random element from an array
   */
  choice(array) {
    if (!array || array.length === 0) return null;
    const idx = this.nextInt(0, array.length - 1);
    return array[idx];
  }

  /**
   * Shuffles an array in-place using Fisher-Yates algorithm
   */
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
