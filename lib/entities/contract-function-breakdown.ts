import { TOP_FUNCTIONS_PER_CONTRACT } from "@/lib/constants";
import type { TreemapNode } from "@/lib/types";

export type ContractFunctionBreakdownRow = {
  functionName: string;
  eventType: string;
  opCount: number;
  /** Share of this function within the contract total (0–100). */
  sharePercent: number;
  /** Drill path under the events treemap root: [soroban category, function, contract]. */
  drillPath: TreemapNode[];
};

export type ContractFunctionBreakdown = {
  rows: ContractFunctionBreakdownRow[];
  contractTotal: number;
  configuredLimit: number;
};

/**
 * Derive top Soroban host functions for a contract from the events treemap
 * (category → function → contract children). Shares are relative to the
 * contract's observed function-row total and therefore sum to ≤ 100%.
 */
export function buildContractFunctionBreakdown(
  eventsRoot: TreemapNode | undefined,
  contractId: string,
  configuredLimit: number = TOP_FUNCTIONS_PER_CONTRACT,
): ContractFunctionBreakdown {
  if (!eventsRoot?.children?.length || !contractId) {
    return { rows: [], contractTotal: 0, configuredLimit };
  }

  const sorobanCategory = eventsRoot.children.find(
    (child) =>
      child.meta?.category === "soroban" ||
      child.name.toLowerCase().includes("soroban"),
  );
  if (!sorobanCategory?.children?.length) {
    return { rows: [], contractTotal: 0, configuredLimit };
  }

  const matches: Omit<ContractFunctionBreakdownRow, "sharePercent">[] = [];

  for (const functionNode of sorobanCategory.children) {
    const contractNode = functionNode.children?.find(
      (child) => child.meta?.id === contractId || child.id === contractId,
    );
    if (!contractNode) continue;

    const opCount =
      contractNode.meta?.opCount ??
      (typeof contractNode.value === "number" ? contractNode.value : 0);
    if (opCount <= 0) continue;

    matches.push({
      functionName: functionNode.name,
      eventType: functionNode.meta?.eventType ?? functionNode.name,
      opCount,
      drillPath: [sorobanCategory, functionNode, contractNode],
    });
  }

  matches.sort((a, b) => b.opCount - a.opCount);
  const limited = matches.slice(0, Math.max(0, configuredLimit));
  const contractTotal = limited.reduce((sum, row) => sum + row.opCount, 0);

  const rows: ContractFunctionBreakdownRow[] = limited.map((row) => ({
    ...row,
    sharePercent:
      contractTotal > 0 ? (row.opCount / contractTotal) * 100 : 0,
  }));

  return { rows, contractTotal, configuredLimit };
}
