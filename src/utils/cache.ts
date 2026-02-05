// src/utils/cache.ts
import Redis from 'ioredis';

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_URL !== 'your_upstash_redis_url_here') {
  redis = new Redis(process.env.UPSTASH_REDIS_URL);
  redis.on('error', (err) => {
    console.error('Redis Error:', err);
    redis = null; // Disable redis if there is a connection error
  });
}

// Fallback to in-memory cache if Redis is not available
const memoryCache = new Map<string, { value: any; expires: number }>();

export const getCache = async (key: string) => {
  if (redis) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis getCache Error:', error);
      redis = null; // Disable redis on error
      return null;
    }
  } else {
    const entry = memoryCache.get(key);
    if (entry && entry.expires > Date.now()) {
      return entry.value;
    }
    return null;
  }
};

export const setCache = async (key: string, value: any, ttl_ms: number) => {
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(value), 'PX', ttl_ms);
    } catch (error) {
      console.error('Redis setCache Error:', error);
      redis = null; // Disable redis on error
    }
  } else {
    memoryCache.set(key, { value, expires: Date.now() + ttl_ms });
  }
};
