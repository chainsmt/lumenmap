import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildKpis } from "@/lib/entities/build-treemap";
import { getFixtureActivityData } from "@/lib/fixtures/activity";
import { getFixtureActiveWalletCount } from "@/lib/fixtures/wallet-kpi";
import type { CategoryRow } from "@/lib/types";

function category(op_count: number): CategoryRow {
  return { type_string: "payment", op_count };
}

describe("activeWallets KPI wiring", () => {
  test("maps source account rows into activeWallets", () => {
    const kpis = buildKpis([category(100)], [], [{ active_accounts: 4321 }]);
    assert.equal(kpis.activeWallets.value, 4321);
    assert.equal(kpis.activeWallets.kind, "entity_count");
  });

  test("returns zero for empty source periods", () => {
    const kpis = buildKpis([category(0)], [], []);
    assert.equal(kpis.activeWallets.value, 0);
  });

  test("fixture mode exposes deterministic wallet KPI values", () => {
    const data = getFixtureActivityData("7d");
    assert.equal(data.kpis.activeWallets.value, getFixtureActiveWalletCount("7d"));
  });
});
