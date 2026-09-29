import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildContractFunctionBreakdown } from "./contract-function-breakdown";
import type { TreemapNode } from "@/lib/types";

const CONTRACT_A = "CCONTRACTA";
const CONTRACT_B = "CCONTRACTB";

function eventsFixture(): TreemapNode {
  return {
    name: "Network Activity",
    value: 1000,
    meta: { type: "root" },
    children: [
      {
        name: "Soroban Contracts",
        value: 800,
        meta: { type: "category", category: "soroban" },
        children: [
          {
            name: "transfer",
            value: 400,
            meta: {
              type: "entity",
              category: "soroban",
              eventType: "transfer",
              opCount: 400,
            },
            children: [
              {
                id: CONTRACT_A,
                name: "SoroSwap",
                value: 250,
                meta: {
                  type: "contract",
                  id: CONTRACT_A,
                  category: "soroban",
                  opCount: 250,
                },
              },
              {
                id: CONTRACT_B,
                name: "Other",
                value: 150,
                meta: {
                  type: "contract",
                  id: CONTRACT_B,
                  category: "soroban",
                  opCount: 150,
                },
              },
            ],
          },
          {
            name: "swap",
            value: 300,
            meta: {
              type: "entity",
              category: "soroban",
              eventType: "swap",
              opCount: 300,
            },
            children: [
              {
                id: CONTRACT_A,
                name: "SoroSwap",
                value: 200,
                meta: {
                  type: "contract",
                  id: CONTRACT_A,
                  category: "soroban",
                  opCount: 200,
                },
              },
            ],
          },
          {
            name: "deposit",
            value: 100,
            meta: {
              type: "entity",
              category: "soroban",
              eventType: "deposit",
              opCount: 100,
            },
            children: [
              {
                id: CONTRACT_A,
                name: "SoroSwap",
                value: 50,
                meta: {
                  type: "contract",
                  id: CONTRACT_A,
                  category: "soroban",
                  opCount: 50,
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("buildContractFunctionBreakdown", () => {
  it("orders functions by op count and keeps shares within the contract total", () => {
    const result = buildContractFunctionBreakdown(eventsFixture(), CONTRACT_A);

    assert.equal(result.rows.length, 3);
    assert.deepEqual(
      result.rows.map((row) => row.functionName),
      ["transfer", "swap", "deposit"],
    );
    assert.equal(result.contractTotal, 500);
    const shareSum = result.rows.reduce((sum, row) => sum + row.sharePercent, 0);
    assert.ok(shareSum <= 100.0001);
    assert.equal(result.rows[0].sharePercent, 50);
    assert.equal(result.rows[0].drillPath.length, 3);
  });

  it("respects the configured top-N limit", () => {
    const result = buildContractFunctionBreakdown(
      eventsFixture(),
      CONTRACT_A,
      2,
    );
    assert.equal(result.rows.length, 2);
    assert.equal(result.configuredLimit, 2);
    assert.equal(result.contractTotal, 450);
  });

  it("returns empty rows with explanatory totals when no breakdown exists", () => {
    const result = buildContractFunctionBreakdown(
      eventsFixture(),
      "CMISSING",
    );
    assert.deepEqual(result.rows, []);
    assert.equal(result.contractTotal, 0);
  });

  it("handles a missing events treemap", () => {
    const result = buildContractFunctionBreakdown(undefined, CONTRACT_A);
    assert.deepEqual(result.rows, []);
  });
});
