import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  resetCacheDriverState,
  setCacheDriver,
  setRedisClient,
} from "@/lib/cache";
import { MemoryCacheDriver } from "@/lib/cache/memory-driver";
import { FakeRedisClient, RedisCacheDriver } from "@/lib/cache/redis-driver";
import {
  clearCache,
  getCached,
  setCache,
  setClock,
} from "@/lib/hubble/cache";
import { metrics } from "@/lib/telemetry/metrics";

describe("cache adapters", () => {
  beforeEach(() => {
    metrics.reset();
    process.env.CACHE_BACKEND = "memory";
    resetCacheDriverState();
    setClock(() => Date.now());
    clearCache();
  });

  it("memory backend stores and retrieves values", () => {
    setCacheDriver(new MemoryCacheDriver());
    setCache("m1", { ok: true }, 60);
    assert.deepEqual(getCached<{ ok: boolean }>("m1"), { ok: true });
  });

  it("redis fake driver shares hits across two driver instances", () => {
    const shared = new FakeRedisClient(() => 1_000);
    setClock(() => 1_000);

    setCacheDriver(new RedisCacheDriver(shared));
    setCache("period:1d", { total: 42 }, 30);
    assert.deepEqual(getCached<{ total: number }>("period:1d", { track: true }), {
      total: 42,
    });

    // Second instance sharing the same Redis client → cache hit
    setCacheDriver(new RedisCacheDriver(shared));
    assert.deepEqual(getCached<{ total: number }>("period:1d", { track: true }), {
      total: 42,
    });
    assert.equal(
      metrics.readCounter({ endpoint: "activity", cache_outcome: "hit" }),
      2,
    );
  });

  it("falls back to memory driver when explicitly configured", () => {
    process.env.CACHE_BACKEND = "redis";
    setRedisClient(null);
    setCacheDriver(new MemoryCacheDriver());
    setCache("fallback", "ok", 10);
    assert.equal(getCached<string>("fallback"), "ok");
    clearCache();
  });
});
