import { formatMs, SLOW_MS, type LatencyStats } from "@/lib/latency";

export function LatencySummary({ stats }: { stats: LatencyStats }) {
  const items = [
    ["Avg", formatMs(stats.avg)],
    ["p50", formatMs(stats.p50)],
    ["p99", formatMs(stats.p99)],
    ["Max", formatMs(stats.max)],
    [`≥ ${formatMs(SLOW_MS)}`, `${stats.slow} / ${stats.count}`],
  ];

  return (
    <section aria-label="Perceived latency">
      <h2 className="mb-2 text-xs font-semibold uppercase text-zinc-500">Perceived latency · caller stops → agent speaks</h2>
      <dl className="grid grid-cols-5 gap-2">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-zinc-200 px-3 py-2">
            <dt className="text-xs text-zinc-500">{label}</dt>
            <dd className="font-mono text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
