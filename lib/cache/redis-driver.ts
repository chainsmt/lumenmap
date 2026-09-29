import type { CacheDriver, CacheEntry, RedisLikeClient } from "./types";

const KEY_PREFIX = "lumenmap:cache:";

/**
 * In-process Redis/KV stand-in that preserves TTL by storing JSON envelopes.
 * Two CacheDriver instances that share the same client observe each other's hits
 * (multi-instance simulation for tests and single-process Redis shims).
 */
export class FakeRedisClient implements RedisLikeClient {
  private readonly store = new Map<string, { value: string; expires: number }>();
  private now: () => number;

  constructor(clock: () => number = () => Date.now()) {
    this.now = clock;
  }

  setClock(clock: () => number): void {
    this.now = clock;
  }

  get(key: string): string | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (this.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: string, ttlSeconds: number): void {
    this.store.set(key, {
      value,
      expires: this.now() + Math.max(1, ttlSeconds) * 1000,
    });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  flushAll(): void {
    this.store.clear();
  }

  keys(prefix: string): string[] {
    const now = this.now();
    const out: string[] = [];
    for (const [key, entry] of this.store) {
      if (now > entry.expires) {
        this.store.delete(key);
        continue;
      }
      if (key.startsWith(prefix)) out.push(key);
    }
    return out;
  }
}

/**
 * Redis/KV-backed driver. Serializes CacheEntry JSON under a stable key prefix
 * so TTL and key structure stay compatible with the legacy in-memory cache.
 */
export class RedisCacheDriver implements CacheDriver {
  constructor(private readonly client: RedisLikeClient) {}

  get(key: string): CacheEntry | null {
    const raw = this.client.get(KEY_PREFIX + key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as CacheEntry;
      if (
        !parsed ||
        typeof parsed !== "object" ||
        typeof parsed.expires !== "number"
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  set(key: string, entry: CacheEntry, ttlSeconds: number): void {
    this.client.set(
      KEY_PREFIX + key,
      JSON.stringify(entry),
      Math.max(1, ttlSeconds),
    );
  }

  delete(key: string): void {
    this.client.del(KEY_PREFIX + key);
  }

  clear(): void {
    for (const key of this.client.keys(KEY_PREFIX)) {
      this.client.del(key);
    }
  }

  *entries(): IterableIterator<[string, CacheEntry]> {
    for (const fullKey of this.client.keys(KEY_PREFIX)) {
      const key = fullKey.slice(KEY_PREFIX.length);
      const entry = this.get(key);
      if (entry) yield [key, entry];
    }
  }
}
