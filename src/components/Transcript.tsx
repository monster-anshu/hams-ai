"use client";

import { useRef, type MouseEvent, type RefObject } from "react";
import { useActiveWord } from "@/hooks/useActiveWord";
import { useFollowPlayback } from "@/hooks/useFollowPlayback";
import type { CallRecord } from "@/lib/call";
import { TurnList } from "./TurnList";

type Props = { call: CallRecord; latencies: Map<string, number>; audioRef: RefObject<HTMLAudioElement | null> };

export function Transcript({ call, latencies, audioRef }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLElement | null>(null);
  const spansRef = useRef<NodeListOf<HTMLElement> | null>(null);
  const { following, followingRef, setFollowing } = useFollowPlayback(scrollRef);
  const words = call.turns.flatMap((t) => t.words);

  useActiveWord(audioRef, words, (i) => {
    spansRef.current ??= scrollRef.current!.querySelectorAll<HTMLElement>("[data-word]");
    activeRef.current?.classList.remove("word-active");
    activeRef.current = i >= 0 ? spansRef.current[i] : null;
    activeRef.current?.classList.add("word-active");
    if (followingRef.current) scrollIntoCenter(scrollRef.current!, activeRef.current);
  });

  const seek = (e: MouseEvent) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-start]");
    if (!target || !audioRef.current) return;
    audioRef.current.currentTime = Number(target.dataset.start) / 1000;
    setFollowing(true);
  };

  const resume = () => {
    setFollowing(true);
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  return (
    <section aria-label="Transcript" className="relative min-h-0 flex-1">
      <div ref={scrollRef} tabIndex={0} onClick={seek} className="h-full overflow-y-auto rounded-lg border border-zinc-200 p-4">
        <TurnList turns={call.turns} latencies={latencies} />
      </div>
      {!following && (
        <button
          type="button"
          onClick={resume}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-sm text-white shadow"
        >
          Back to playback
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
