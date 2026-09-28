import { Fragment } from "react";
import type { Turn } from "@/lib/call";
import { formatMs, SLOW_MS } from "@/lib/latency";

export function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Rendered once; playback highlighting is applied to the DOM directly, not through props.
export function TurnList({ turns, latencies }: { turns: Turn[]; latencies: Map<string, number> }) {
  return (
    <ol className="flex flex-col gap-4">
      {turns.map((turn) => (
        <li key={turn.id} className="flex gap-3">
          <button
            type="button"
            data-start={turn.startMs}
            className="h-fit shrink-0 font-mono text-xs text-zinc-500 hover:text-zinc-900"
            aria-label={`Play from ${formatTime(turn.startMs)}`}
          >
            {formatTime(turn.startMs)}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold uppercase ${turn.speaker === "agent" ? "text-indigo-600" : "text-emerald-600"}`}>
                {turn.speaker}
              </span>
              <LatencyBadge ms={latencies.get(turn.id)} />
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
      ))}
    </ol>
  );
}

function LatencyBadge({ ms }: { ms?: number }) {
  if (ms === undefined) return null;
  const slow = ms >= SLOW_MS;
  return (
    <span
      title="Caller stopped → agent started"
      className={`rounded px-1.5 font-mono text-xs ${slow ? "bg-red-100 font-semibold text-red-700" : "bg-zinc-100 text-zinc-600"}`}
    >
      <span className="sr-only">Response latency </span>
      {formatMs(ms)}
      {slow && <span className="sr-only"> (slow)</span>}
    </span>
  );
}
