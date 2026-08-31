import { FIXTURE_PERIOD_MULTIPLIERS } from "@/lib/fixtures/raw-data";
import type { Period } from "@/lib/types";

/** Deterministic active source-wallet count for fixture KPI wiring. */
export function getFixtureActiveWalletCount(period: Period): number {
  return 12_500 * FIXTURE_PERIOD_MULTIPLIERS[period];
}
