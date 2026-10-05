import type { Messages } from "@/lib/i18n";
import {
  describeLatency,
  formatMs,
  SLOW_MS,
  type TurnLatency,
} from "@/lib/latency";
import { StageBar } from "./StageBar";
import { ToolChip } from "./ToolChip";

type Props = { latency: TurnLatency; scaleMs: number; m: Messages };

export function TurnLatencyRow({ latency, scaleMs, m }: Props) {
  const slow = latency.perceivedMs >= SLOW_MS;
  const summary = describeLatency(latency, m);

  return (
    <div title={summary} className="flex items-center gap-2">
      <span className="sr-only">
        {m.responseLatency} {summary}
        {slow && ` (${m.slow})`}
      </span>
      <span
        aria-hidden
        className={`w-12 shrink-0 rounded px-1.5 text-center font-mono text-xs ${slow ? "bg-red-500/15 font-semibold text-red-700 dark:text-red-300" : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400"}`}
      >
        {formatMs(latency.perceivedMs)}
      </span>
      <div className="w-40">
        <StageBar stages={latency.stages} scaleMs={scaleMs} />
      </div>
      {latency.tool && (
        <span aria-hidden>
          <ToolChip {...latency.tool} statusLabel={m[latency.tool.status]} />
        </span>
      )}
    </div>
  );
}
