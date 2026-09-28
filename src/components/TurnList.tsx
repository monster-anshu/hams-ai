import { Fragment } from "react";
import type { Turn } from "@/lib/call";
import type { TurnLatency } from "@/lib/latency";
import { TurnLatencyRow } from "./TurnLatencyRow";

export function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

type Props = { turns: Turn[]; latencies: Map<string, TurnLatency>; scaleMs: number };

// Rendered once; playback highlighting is applied to the DOM directly, not through props.
export function TurnList({ turns, latencies, scaleMs }: Props) {
  return (
    <ol className="flex flex-col gap-4">
      {turns.map((turn) => {
        const latency = latencies.get(turn.id);
        return (
          <li key={turn.id} className="flex gap-3">
            <button
              type="button"
              data-start={turn.startMs}
              className="h-fit shrink-0 font-mono text-xs text-zinc-500 hover:text-zinc-900"
              aria-label={`Play from ${formatTime(turn.startMs)}`}
            >
              {formatTime(turn.startMs)}
            </button>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold uppercase ${turn.speaker === "agent" ? "text-indigo-600" : "text-emerald-600"}`}>
                  {turn.speaker}
                </span>
                {latency && <TurnLatencyRow latency={latency} scaleMs={scaleMs} />}
              </div>
              <p dir="auto" className="leading-7">
                {turn.words.map((w, i) => (
                  <Fragment key={i}>
                    <span data-word data-start={w.startMs} className="word">
                      {w.w}
                    </span>{" "}
                  </Fragment>
                ))}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
