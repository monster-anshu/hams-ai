import { useEffect, useEffectEvent, type RefObject } from "react";
import { findActiveWord, sortByStart } from "@/lib/activeWord";
import type { Word } from "@/lib/call";

// Polls audio time every frame while playing; calls onChange only when the active word changes.
export function useActiveWord(
  audioRef: RefObject<HTMLAudioElement | null>,
  words: Word[],
  onChange: (index: number) => void,
) {
  const notify = useEffectEvent(onChange);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const order = sortByStart(words);
    let current = -1;
    let frame = 0;

    const tick = () => {
      const i = findActiveWord(words, order, audio.currentTime * 1000);
      if (i !== current) {
        current = i;
        notify(i);
      }
    };
    const loop = () => {
      tick();
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      loop();
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      tick();
    };

    audio.addEventListener("play", start);
    audio.addEventListener("pause", stop);
    audio.addEventListener("seeked", tick);
    if (!audio.paused) start();

    return () => {
      cancelAnimationFrame(frame);
      audio.removeEventListener("play", start);
      audio.removeEventListener("pause", stop);
      audio.removeEventListener("seeked", tick);
    };
  }, [audioRef, words]);
}
