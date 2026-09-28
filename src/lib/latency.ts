import type { Turn } from "./call";

export const SLOW_MS = 1000;

export type LatencyStats = { count: number; avg: number; p50: number; p99: number; max: number; slow: number };

// Perceived latency: customer's last turn ends → agent's reply starts. Keyed by the agent turn id.
// Negative gaps mean the agent talked over the caller; those are overlaps, not latency, so they're skipped.
export function turnLatencies(turns: Turn[]): Map<string, number> {
  const result = new Map<string, number>();
  let lastCustomer: Turn | null = null;

  for (const turn of turns) {
    if (turn.speaker === "customer") {
      lastCustomer = turn;
      continue;
    }
    if (lastCustomer) {
      const gap = turn.startMs - lastCustomer.endMs;
      if (gap >= 0) result.set(turn.id, gap);
      lastCustomer = null;
    }
  }
  return result;
}

// Nearest-rank percentile on a sorted array.
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.max(0, rank - 1)];
}

export function summarize(values: number[]): LatencyStats {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    count: sorted.length,
    avg: sorted.length ? Math.round(sum / sorted.length) : 0,
    p50: percentile(sorted, 50),
    p99: percentile(sorted, 99),
    max: sorted.at(-1) ?? 0,
    slow: sorted.filter((v) => v >= SLOW_MS).length,
  };
}

export function formatMs(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}
