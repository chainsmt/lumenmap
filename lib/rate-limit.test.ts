import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  clearRateLimitStore,
  consumeRateLimit,
  enforceRateLimit,
  setRateLimitClock,
} from "./rate-limit";

describe("consumeRateLimit", () => {
  beforeEach(() => {
    clearRateLimitStore();
    let t = 1_000_000;
    setRateLimitClock(() => t);
    (globalThis as { __advance?: (ms: number) => void }).__advance = (ms) => {
      t += ms;
    };
  });

  it("allows requests under the limit", () => {
    const config = { limit: 3, windowMs: 60_000 };
    assert.equal(consumeRateLimit("a", config).allowed, true);
    assert.equal(consumeRateLimit("a", config).allowed, true);
    const third = consumeRateLimit("a", config);
    assert.equal(third.allowed, true);
    assert.equal(third.remaining, 0);
  });

  it("blocks over-limit requests until the window resets", () => {
    const config = { limit: 2, windowMs: 10_000 };
    consumeRateLimit("b", config);
    consumeRateLimit("b", config);
    const blocked = consumeRateLimit("b", config);
    assert.equal(blocked.allowed, false);
    assert.equal(blocked.retryAfterSeconds >= 1, true);

    (globalThis as unknown as { __advance: (ms: number) => void }).__advance(
      10_000,
    );
    const afterReset = consumeRateLimit("b", config);
    assert.equal(afterReset.allowed, true);
  });

  it("scopes counters per key", () => {
    const config = { limit: 1, windowMs: 60_000 };
    assert.equal(consumeRateLimit("one", config).allowed, true);
    assert.equal(consumeRateLimit("one", config).allowed, false);
    assert.equal(consumeRateLimit("two", config).allowed, true);
  });
});

describe("enforceRateLimit", () => {
  beforeEach(() => {
    clearRateLimitStore();
    process.env.RATE_LIMIT_DISABLED = "";
    process.env.RATE_LIMIT_V1_MAX = "2";
    process.env.RATE_LIMIT_V1_WINDOW_MS = "60000";
    setRateLimitClock(() => 5_000_000);
  });

  it("returns 429 JSON with Retry-After when exceeded", () => {
    const request = new Request("http://localhost/api/v1/activity", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    });
    assert.equal(enforceRateLimit(request, "v1"), null);
    assert.equal(enforceRateLimit(request, "v1"), null);
    const limited = enforceRateLimit(request, "v1");
    assert.ok(limited);
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get("Retry-After"), "60");
  });

  it("skips enforcement when RATE_LIMIT_DISABLED=true", () => {
    process.env.RATE_LIMIT_DISABLED = "true";
    const request = new Request("http://localhost/api/v1/activity");
    for (let i = 0; i < 20; i += 1) {
      assert.equal(enforceRateLimit(request, "v1"), null);
    }
  });
});
