import { describeLatency, formatMs, SLOW_MS, type TurnLatency } from "@/lib/latency";
import { StageBar } from "./StageBar";
import { ToolChip } from "./ToolChip";

export function TurnLatencyRow({ latency, scaleMs }: { latency: TurnLatency; scaleMs: number }) {
  const slow = latency.perceivedMs >= SLOW_MS;
  const summary = describeLatency(latency);

  return (
    <div title={summary} className="flex items-center gap-2">
      <span className="sr-only">Response latency {summary}</span>
      <span
        aria-hidden
        className={`w-12 shrink-0 rounded px-1.5 text-center font-mono text-xs ${slow ? "bg-red-100 font-semibold text-red-700" : "bg-zinc-100 text-zinc-600"}`}
      >
        {formatMs(latency.perceivedMs)}
      </span>
      <div className="w-40">
        <StageBar stages={latency.stages} scaleMs={scaleMs} />
      </div>
      {latency.tool && (
        <span aria-hidden>
          <ToolChip {...latency.tool} />
        </span>
      )}
    </div>
  );
}
