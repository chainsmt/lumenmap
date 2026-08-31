import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildKpis } from "@/lib/entities/build-treemap";
import { getFixtureActivityData } from "@/lib/fixtures/activity";
import { getFixtureActiveDestinationCount } from "@/lib/fixtures/destination-kpi";
import type { CategoryRow } from "@/lib/types";

function category(op_count: number): CategoryRow {
  return { type_string: "payment", op_count };
}

describe("activeDestinationAccounts KPI wiring", () => {
  test("maps destination count into activeDestinationAccounts", () => {
    const kpis = buildKpis([category(100)], [], [], 0, 654);
    assert.equal(kpis.activeDestinationAccounts.value, 654);
    assert.equal(kpis.activeDestinationAccounts.kind, "entity_count");
  });

  test("returns zero for empty destination periods", () => {
    const kpis = buildKpis([category(0)], [], [], 0, 0);
    assert.equal(kpis.activeDestinationAccounts.value, 0);
  });

  test("fixture mode exposes deterministic destination KPI values", () => {
    const data = getFixtureActivityData("7d");
    assert.equal(
      data.kpis.activeDestinationAccounts.value,
      getFixtureActiveDestinationCount("7d"),
    );
  });
});
