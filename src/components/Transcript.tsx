"use client";

import { useRef, type MouseEvent, type RefObject } from "react";
import { useActiveWord } from "@/hooks/useActiveWord";
import { useFollowPlayback } from "@/hooks/useFollowPlayback";
import { useLocale } from "@/hooks/useLocale";
import type { CallRecord } from "@/lib/call";
import type { TurnLatency } from "@/lib/latency";
import type { Mark } from "@/lib/marks";
import { seekTo } from "@/lib/player";
import { TurnList } from "./TurnList";

type Props = {
  call: CallRecord;
  latencies: Map<string, TurnLatency>;
  marks: Mark[];
  activeMarkId: string | null;
  audioRef: RefObject<HTMLAudioElement | null>;
};

export function Transcript({ call, latencies, marks, activeMarkId, audioRef }: Props) {
  const { m } = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLElement | null>(null);
  const spansRef = useRef<NodeListOf<HTMLElement> | null>(null);
  const { following, followingRef, setFollowing } = useFollowPlayback(scrollRef);
  const words = call.turns.flatMap((t) => t.words);
  const scaleMs = Math.max(0, ...[...latencies.values()].map((l) => l.perceivedMs));

  useActiveWord(audioRef, words, (i) => {
    spansRef.current ??= scrollRef.current!.querySelectorAll<HTMLElement>("[data-word]");
    activeRef.current?.classList.remove("word-active");
    activeRef.current = i >= 0 ? spansRef.current[i] : null;
    activeRef.current?.classList.add("word-active");
    if (followingRef.current) scrollIntoCenter(scrollRef.current!, activeRef.current);
  });

  const seek = (e: MouseEvent) => {
    // A drag-select ends with a click; that's for marking, not seeking.
    if (!window.getSelection()?.isCollapsed) return;
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-start]");
    if (!target || !audioRef.current) return;
    seekTo(audioRef.current, Number(target.dataset.start));
    setFollowing(true);
  };

  const resume = () => {
    setFollowing(true);
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  return (
    <section aria-label={m.transcript} className="relative min-h-[60dvh] flex-1 lg:min-h-0">
      <div
        ref={scrollRef}
        tabIndex={0}
        data-transcript
        onClick={seek}
        className="absolute inset-0 overflow-y-auto rounded-lg border border-zinc-500/30 p-4 focus-visible:outline-2 focus-visible:outline-indigo-500"
      >
        <TurnList turns={call.turns} latencies={latencies} scaleMs={scaleMs} marks={marks} activeMarkId={activeMarkId} />
      </div>
      {!following && (
        <button
          type="button"
          onClick={resume}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-sm text-white shadow dark:bg-zinc-100 dark:text-zinc-900"
        >
          {m.backToPlayback}
        </button>
      )}
    </section>
  );
}

// Only scroll once the word drifts out of the middle band, so the view doesn't jitter every word.
function scrollIntoCenter(container: HTMLElement, el: HTMLElement | null) {
  if (!el) return;
  const box = container.getBoundingClientRect();
  const { top } = el.getBoundingClientRect();
  const band = box.height * 0.25;
  if (top < box.top + band || top > box.bottom - band) {
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}
