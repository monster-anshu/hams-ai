import { useRef, type RefObject } from "react";
import { findActiveWord, sortByStart } from "@/lib/activeWord";
import type { Word } from "@/lib/call";
import { usePlaybackFrame } from "./usePlaybackFrame";

// Calls onChange only when the active word changes, not on every frame.
export function useActiveWord(
  audioRef: RefObject<HTMLAudioElement | null>,
  words: Word[],
  onChange: (index: number) => void,
) {
  const order = sortByStart(words);
  const current = useRef(-1);

  usePlaybackFrame(audioRef, (ms) => {
    const i = findActiveWord(words, order, ms);
    if (i !== current.current) {
      current.current = i;
      onChange(i);
    }
  });
}
