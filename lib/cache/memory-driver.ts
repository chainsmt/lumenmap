import type { CacheDriver, CacheEntry } from "./types";

/** Process-local Map driver (default). */
export class MemoryCacheDriver implements CacheDriver {
  private readonly store = new Map<string, CacheEntry>();

  get(key: string): CacheEntry | null {
    return this.store.get(key) ?? null;
  }

  set(key: string, entry: CacheEntry, _ttlSeconds: number): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  entries(): IterableIterator<[string, CacheEntry]> {
    return this.store.entries();
  }
}
