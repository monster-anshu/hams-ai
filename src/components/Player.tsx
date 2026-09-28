"use client";

import { useEffect, useState, type RefObject } from "react";
import { useLocale } from "@/hooks/useLocale";
import { keysFor, SPEEDS } from "@/lib/shortcuts";

type Props = { audioRef: RefObject<HTMLAudioElement | null>; src: string; onNextSlow: () => void };

// The audio element owns the playback rate; the select just mirrors it, so shortcuts stay in sync.
export function Player({ audioRef, src, onNextSlow }: Props) {
  const { m } = useLocale();
  const [rate, setRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onRate = () => setRate(audio.playbackRate);
    audio.addEventListener("ratechange", onRate);
    return () => audio.removeEventListener("ratechange", onRate);
  }, [audioRef]);

  return (
    <div className="flex flex-col gap-2">
      <audio ref={audioRef} src={src} controls preload="metadata" className="w-full" aria-keyshortcuts={keysFor("playPause")} />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          {m.speed}
          <select
            value={rate}
            onChange={(e) => audioRef.current && (audioRef.current.playbackRate = Number(e.target.value))}
            aria-keyshortcuts={`${keysFor("slower")} ${keysFor("faster")}`}
            className="rounded-md border border-zinc-500/30 bg-transparent px-2 py-1"
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={onNextSlow}
          aria-keyshortcuts={keysFor("nextSlow")}
          className="rounded-md border border-red-500/40 px-3 py-1 text-red-700 hover:bg-red-500/10 dark:text-red-300"
        >
          {m.nextSlow}
        </button>
      </div>
    </div>
  );
}
