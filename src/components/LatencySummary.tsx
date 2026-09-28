import { formatMs, SLOW_MS, STAGE_LABELS, STAGES, stageTotals, summarize, type TurnLatency } from "@/lib/latency";
import { STAGE_COLORS, StageBar } from "./StageBar";

export function LatencySummary({ latencies }: { latencies: TurnLatency[] }) {
  const stats = summarize(latencies.map((l) => l.perceivedMs));
  const totals = stageTotals(latencies);
  const totalMs = STAGES.reduce((sum, s) => sum + totals[s], 0);

  const tiles = [
    ["Avg", formatMs(stats.avg)],
    ["p50", formatMs(stats.p50)],
    ["p99", formatMs(stats.p99)],
    ["Max", formatMs(stats.max)],
    [`≥ ${formatMs(SLOW_MS)}`, `${stats.slow} / ${stats.count}`],
  ];

  return (
    <section aria-label="Perceived latency" className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase text-zinc-500">Perceived latency · caller stops → agent speaks</h2>
      <dl className="grid grid-cols-5 gap-2">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-zinc-200 px-3 py-2">
            <dt className="text-xs text-zinc-500">{label}</dt>
            <dd className="font-mono text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-2">
        <h3 className="text-xs text-zinc-500">Where the time went, across {stats.count} replies</h3>
        <StageBar stages={totals} scaleMs={totalMs} />
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {STAGES.map((s) => (
            <li key={s} className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-sm" style={{ background: STAGE_COLORS[s] }} />
              <span className="text-zinc-600">{STAGE_LABELS[s]}</span>
              <span className="font-mono">
                {formatMs(totals[s])} · {totalMs ? Math.round((totals[s] / totalMs) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
