"use client";

import { useRef, type MouseEvent, type RefObject } from "react";
import { usePlaybackFrame } from "@/hooks/usePlaybackFrame";
import { formatMs, type SlowReply } from "@/lib/latency";
import type { Mark } from "@/lib/marks";
import { formatTime } from "@/lib/time";

type Props = {
  durationMs: number;
  slow: SlowReply[];
  marks: Mark[];
  activeMarkId: string | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  onSeek: (ms: number) => void;
};

// Mouse overview only (aria-hidden): the "Next slow reply" button, shortcuts and the marks list
// give keyboard and screen-reader users the same jumps. Time runs left to right in both languages,
// matching the native player.
export function Timeline({
  durationMs,
  slow,
  marks,
  activeMarkId,
  audioRef,
  onSeek,
}: Props) {
  const playheadRef = useRef<HTMLDivElement>(null);
  const pct = (ms: number) =>
    `${(Math.min(ms, durationMs) / durationMs) * 100}%`;
  const maxLatency = Math.max(1, ...slow.map((r) => r.latency.perceivedMs));

  usePlaybackFrame(audioRef, (ms) => {
    if (playheadRef.current) playheadRef.current.style.left = pct(ms);
  });

  const seek = (e: MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    onSeek(((e.clientX - box.left) / box.width) * durationMs);
  };

  return (
    <div
      aria-hidden
      dir="ltr"
      onClick={seek}
      className="relative h-10 cursor-pointer overflow-hidden rounded-md bg-zinc-500/10"
    >
      {marks.map((mark) => (
        <div
          key={mark.id}
          title={`${mark.label} · ${formatTime(mark.startMs)}–${formatTime(mark.endMs)}`}
          className={`absolute inset-y-0 min-w-[3px] ${mark.id === activeMarkId ? "bg-indigo-500/50 ring-2 ring-indigo-500" : "bg-indigo-500/25"}`}
          style={{
            left: pct(mark.startMs),
            width: pct(mark.endMs - mark.startMs),
          }}
        />
      ))}
      {slow.map((r) => (
        <div
          key={r.turn.id}
          title={`${formatTime(r.silenceStartMs)} · ${formatMs(r.latency.perceivedMs)}`}
          className="absolute bottom-0 w-0.5 rounded-t bg-red-500"
          style={{
            left: pct(r.silenceStartMs),
            height: `${30 + (70 * r.latency.perceivedMs) / maxLatency}%`,
          }}
        />
      ))}
      <div
        ref={playheadRef}
        className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-zinc-900 dark:bg-zinc-100"
      />
    </div>
  );
}
