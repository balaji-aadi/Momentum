import crypto from 'crypto';

/**
 * JudgeRateLimiter - Redis Sliding Window Token Bucket Rate Limiter
 * (Phase 13 Rate Limiting Module)
 * 
 * Enforces per-user (authenticated) and per-IP (anonymous) submission quotas
 * with independent RUN and SUBMIT buckets.
 */
export class JudgeRateLimiter {
  constructor({ redisClient = null } = {}) {
    this.redis = redisClient;
    this.memoryBuckets = new Map(); // Fallback in-memory rate limit logs
  }

  static getLimits(executionType = 'RUN', isAuthenticated = false) {
    const isSubmit = executionType.toUpperCase() === 'SUBMIT';
    if (isAuthenticated) {
      return isSubmit 
        ? Number(process.env.JUDGE_SUBMIT_RATE_LIMIT || 10)
        : Number(process.env.JUDGE_RUN_RATE_LIMIT || 30);
    }
    return isSubmit
      ? Number(process.env.JUDGE_ANON_SUBMIT_RATE_LIMIT || 5)
      : Number(process.env.JUDGE_ANON_RUN_RATE_LIMIT || 15);
  }

  async checkLimit({ userId = null, ipAddress = '127.0.0.1', executionType = 'RUN' }) {
    if (process.env.JUDGE_RATE_LIMITING_ENABLED === 'false') {
      return { allowed: true, remaining: 999, retryAfterSeconds: 0 };
    }

    const type = executionType.toUpperCase();
    const isAuthenticated = Boolean(userId && String(userId).trim() !== '' && String(userId) !== 'anonymous');
    const identityKey = isAuthenticated ? `usr_${userId}` : `ip_${ipAddress}`;
    const limit = JudgeRateLimiter.getLimits(type, isAuthenticated);
    const windowMs = 60000; // 1 minute window
    const now = Date.now();

    if (this.redis && this.redis.status === 'ready') {
      const redisKey = `sarthi:ratelimit:${identityKey}:${type}`;
      const memberId = `${now}_${crypto.randomUUID().slice(0, 6)}`;
      const windowStart = now - windowMs;

      try {
        await this.redis.zremrangebyscore(redisKey, 0, windowStart);
        const currentCount = await this.redis.zcard(redisKey);

        if (currentCount >= limit) {
          const oldest = await this.redis.zrange(redisKey, 0, 0, 'WITHSCORES');
          const oldestTime = oldest && oldest.length >= 2 ? Number(oldest[1]) : now;
          const retryAfter = Math.max(1, Math.ceil((oldestTime + windowMs - now) / 1000));
          return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
        }

        await this.redis.zadd(redisKey, now, memberId);
        return { allowed: true, remaining: limit - currentCount - 1, retryAfterSeconds: 0 };
      } catch (err) {
        console.error("JudgeRateLimiter Redis Error, falling back to memory:", err);
      }
    }

    // In-Memory Fallback Implementation
    const memKey = `${identityKey}:${type}`;
    if (!this.memoryBuckets.has(memKey)) {
      this.memoryBuckets.set(memKey, []);
    }
    const timestamps = this.memoryBuckets.get(memKey).filter(t => t > now - windowMs);
    
    if (timestamps.length >= limit) {
      const oldestTime = timestamps[0] || now;
      const retryAfter = Math.max(1, Math.ceil((oldestTime + windowMs - now) / 1000));
      return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
    }

    timestamps.push(now);
    this.memoryBuckets.set(memKey, timestamps);
    return { allowed: true, remaining: limit - timestamps.length, retryAfterSeconds: 0 };
  }
}
