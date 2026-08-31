import { FIXTURE_PERIOD_MULTIPLIERS } from "@/lib/fixtures/raw-data";
import type { Period } from "@/lib/types";

/** Deterministic active destination-account count for fixture KPI wiring. */
export function getFixtureActiveDestinationCount(period: Period): number {
  return 9_800 * FIXTURE_PERIOD_MULTIPLIERS[period];
}
