import { buildTimeseries } from "@/lib/hubble/activity";
import { resolvePeriod } from "@/lib/periods";
import type { ActivityTimeseries, Period, TimeseriesRawRow } from "@/lib/types";
import { FIXTURE_PERIOD_MULTIPLIERS } from "@/lib/fixtures/raw-data";

const BASE_DAILY_PATTERN: { tx_count: number; op_count: number }[] = [
  { tx_count: 45_000, op_count: 135_000 },
  { tx_count: 52_000, op_count: 156_000 },
  { tx_count: 0, op_count: 0 },
  { tx_count: 38_000, op_count: 114_000 },
  { tx_count: 120_000, op_count: 360_000 },
  { tx_count: 41_000, op_count: 123_000 },
  { tx_count: 48_000, op_count: 144_000 },
];

function buildDailyRawRows(start: Date, dayCount: number, multiplier: number): TimeseriesRawRow[] {
  const rows: TimeseriesRawRow[] = [];
  for (let i = 0; i < dayCount; i++) {
    const pattern = BASE_DAILY_PATTERN[i % BASE_DAILY_PATTERN.length];
    const bucket = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + i),
    );
    rows.push({
      bucket_time: bucket.toISOString(),
      tx_count: Math.round(pattern.tx_count * multiplier),
      op_count: Math.round(pattern.op_count * multiplier),
    });
  }
  return rows;
}

function periodDayCount(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.floor(ms / 86_400_000) + 1);
}

export function getFixtureTimeseries(period: Period, now = new Date()): ActivityTimeseries {
  const range = resolvePeriod(period, now);
  const multiplier = FIXTURE_PERIOD_MULTIPLIERS[period];
  const rawRows =
    period === "1d"
      ? []
      : buildDailyRawRows(range.start, periodDayCount(range.start, range.end), multiplier);
  return buildTimeseries(period, range.start, range.end, rawRows, now);
}
