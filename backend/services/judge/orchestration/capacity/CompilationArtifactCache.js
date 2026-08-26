import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * CompilationArtifactCache - Single-Flight Immutable Artifact Caching Engine
 * (Phase 14 Optimization Module - Stage 14.2)
 * 
 * Caches compiled binary object files (.o, .class) using an immutable sha256 key
 * containing schema version (v1), source code, harness version, compiler flags, and target ABI.
 * Implements a single-flight mutex lock to prevent duplicate parallel compilations.
 */
export class CompilationArtifactCache {
  constructor({
    cacheDir = process.env.JUDGE_CACHE_DIR || path.join(process.cwd(), 'scratch', 'compilation_cache'),
    maxSizeMb = Number(process.env.JUDGE_CACHE_MAX_SIZE_MB || 500),
    ttlHours = Number(process.env.JUDGE_CACHE_TTL_HOURS || 24)
  } = {}) {
    this.cacheDir = cacheDir;
    this.maxSizeBytes = maxSizeMb * 1024 * 1024;
    this.ttlMs = ttlHours * 60 * 60 * 1000;
    this.schemaVersion = 'v1';
    this.singleFlightLocks = new Map(); // hash -> promise
    this.inMemoryMeta = new Map();      // hash -> metadata object

    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Generates an immutable sha256 cache identity key with schema versioning
   */
  generateCacheKey({
    code = '',
    language = '',
    harnessVersion = '1.0',
    packageVersion = '1.0',
    compilerVersion = 'gcc13',
    compilerFlags = '-O2',
    runtimeVersion = 'node20',
    targetArchABI = 'x86_64-linux-gnu'
  } = {}) {
    const rawString = [
      this.schemaVersion,
      code,
      language,
      harnessVersion,
      packageVersion,
      compilerVersion,
      compilerFlags,
      runtimeVersion,
      targetArchABI
    ].join('::');

    return crypto.createHash('sha256').update(rawString).digest('hex');
  }

  /**
   * Single-flight execution lock wrapper
   */
  async executeSingleFlight(cacheKey, compileFn) {
    if (this.singleFlightLocks.has(cacheKey)) {
      // Wait for existing single-flight compilation to complete
      return await this.singleFlightLocks.get(cacheKey);
    }

    const compilePromise = (async () => {
      try {
        return await compileFn();
      } finally {
        this.singleFlightLocks.delete(cacheKey);
      }
    })();

    this.singleFlightLocks.set(cacheKey, compilePromise);
    return await compilePromise;
  }

  /**
   * Retrieves artifact from cache if valid and uncorrupted
   */
  async getArtifact(cacheKey) {
    if (process.env.JUDGE_COMPILATION_CACHE_ENABLED === 'false') {
      return null;
    }

    const meta = this.inMemoryMeta.get(cacheKey);
    if (!meta) return null;

    // Check TTL
    if (Date.now() - meta.cachedAt > this.ttlMs) {
      await this.evict(cacheKey);
      return null;
    }

    const artifactPath = path.join(this.cacheDir, `${cacheKey}.bin`);
    if (!fs.existsSync(artifactPath)) {
      this.inMemoryMeta.delete(cacheKey);
      return null;
    }

    try {
      const buffer = fs.readFileSync(artifactPath);
      const actualSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

      // Checksum verification gate
      if (actualSha256 !== meta.checksum) {
        console.warn(`[CompilationArtifactCache] Checksum mismatch for ${cacheKey}. Evicting corrupted entry.`);
        await this.evict(cacheKey);
        return null;
      }

      meta.lastAccessedAt = Date.now();
      return {
        artifactPath,
        buffer,
        checksum: meta.checksum,
        metadata: meta
      };
    } catch (err) {
      await this.evict(cacheKey);
      return null;
    }
  }

  /**
   * Stores binary artifact in cache atomically
   */
  async storeArtifact(cacheKey, buffer, extraMeta = {}) {
    if (process.env.JUDGE_COMPILATION_CACHE_ENABLED === 'false') {
      return false;
    }

    try {
      const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
      const artifactPath = path.join(this.cacheDir, `${cacheKey}.bin`);
      const tempPath = `${artifactPath}.tmp.${Date.now()}`;

      // Atomic write protocol
      fs.writeFileSync(tempPath, buffer);
      fs.renameSync(tempPath, artifactPath);

      const meta = {
        cacheKey,
        checksum,
        sizeBytes: buffer.length,
        cachedAt: Date.now(),
        lastAccessedAt: Date.now(),
        schemaVersion: this.schemaVersion,
        ...extraMeta
      };

      this.inMemoryMeta.set(cacheKey, meta);
      await this.enforceSizeCap();
      return true;
    } catch (err) {
      console.error(`[CompilationArtifactCache] Failed to store artifact for ${cacheKey}:`, err);
      return false;
    }
  }

  async evict(cacheKey) {
    this.inMemoryMeta.delete(cacheKey);
    const artifactPath = path.join(this.cacheDir, `${cacheKey}.bin`);
    try {
      if (fs.existsSync(artifactPath)) fs.unlinkSync(artifactPath);
    } catch (e) {}
  }

  async enforceSizeCap() {
    let totalSizeBytes = 0;
    const entries = [];

    for (const [key, meta] of this.inMemoryMeta.entries()) {
      totalSizeBytes += meta.sizeBytes;
      entries.push({ key, lastAccessedAt: meta.lastAccessedAt });
    }

    if (totalSizeBytes <= this.maxSizeBytes) return;

    // LRU eviction order
    entries.sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);

    for (const entry of entries) {
      if (totalSizeBytes <= this.maxSizeBytes) break;
      const meta = this.inMemoryMeta.get(entry.key);
      if (meta) {
        totalSizeBytes -= meta.sizeBytes;
        await this.evict(entry.key);
      }
    }
  }

  clear() {
    this.inMemoryMeta.clear();
    this.singleFlightLocks.clear();
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.cacheDir, file));
      }
    } catch (e) {}
  }
}
