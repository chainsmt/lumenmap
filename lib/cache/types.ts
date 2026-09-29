export type CacheEntry = {
  data: unknown;
  expires: number;
};

/**
 * Pluggable cache backend. Implementations must preserve TTL expiry semantics:
 * expired entries must not be returned from get().
 */
export interface CacheDriver {
  get(key: string): CacheEntry | null;
  set(key: string, entry: CacheEntry, ttlSeconds: number): void;
  delete(key: string): void;
  clear(): void;
  /** Iterate live entries for proactive pruning. */
  entries(): IterableIterator<[string, CacheEntry]>;
}

/** Minimal Redis-like client used by the Redis/KV driver (sync fake or shim). */
export interface RedisLikeClient {
  get(key: string): string | null;
  set(key: string, value: string, ttlSeconds: number): void;
  del(key: string): void;
  flushAll(): void;
  keys(prefix: string): string[];
}
