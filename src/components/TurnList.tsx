import { Fragment } from "react";
import { useLocale } from "@/hooks/useLocale";
import { dominantLang, hasArabic } from "@/lib/arabic";
import type { Turn } from "@/lib/call";
import { format } from "@/lib/i18n";
import type { TurnLatency } from "@/lib/latency";
import { overlaps, type Mark } from "@/lib/marks";
import { formatTime } from "@/lib/time";
import { TurnLatencyRow } from "./TurnLatencyRow";

type Props = {
  turns: Turn[];
  latencies: Map<string, TurnLatency>;
  scaleMs: number;
  marks: Mark[];
  activeMarkId: string | null;
};

// Re-renders only when marks or language change; playback highlighting touches the DOM directly.
export function TurnList({ turns, latencies, scaleMs, marks, activeMarkId }: Props) {
  const { m } = useLocale();
  const activeMark = marks.find((mark) => mark.id === activeMarkId);

  return (
    <ol className="flex flex-col gap-4">
      {turns.map((turn) => {
        const latency = latencies.get(turn.id);
        const lang = dominantLang(turn.text);
        const inActive = activeMark && overlaps(activeMark, turn.startMs, turn.endMs);
        const inAny = marks.some((mark) => overlaps(mark, turn.startMs, turn.endMs));
        const markClass = inActive ? "bg-indigo-500/15 ring-1 ring-indigo-500/50" : inAny ? "border-s-2 border-indigo-400" : "border-s-2 border-transparent";

        return (
          <li key={turn.id} data-active-mark={inActive || undefined} className={`flex gap-3 rounded-md ps-2 ${markClass}`}>
            <button
              type="button"
              data-start={turn.startMs}
              className="h-fit shrink-0 font-mono text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              aria-label={format(m.playFrom, { time: formatTime(turn.startMs) })}
            >
              {formatTime(turn.startMs)}
            </button>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`text-xs font-semibold uppercase ${turn.speaker === "agent" ? "text-indigo-500" : "text-emerald-500"}`}>
                  {m[turn.speaker]}
                </span>
                {latency && <TurnLatencyRow latency={latency} scaleMs={scaleMs} m={m} />}
              </div>
              <p dir="auto" lang={lang} className="leading-7">
                {turn.words.map((w, i) => {
                  const wordLang = hasArabic(w.w) ? "ar" : "en";
                  return (
                    <Fragment key={i}>
                      <span data-word data-start={w.startMs} lang={wordLang !== lang ? wordLang : undefined} className="word">
                        {w.w}
                      </span>{" "}
                    </Fragment>
                  );
                })}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
