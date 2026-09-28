import type { Word } from "./call";

// Turns can overlap (barge-ins), so the flat word list isn't guaranteed sorted.
export function sortByStart(words: Word[]): number[] {
  return words.map((_, i) => i).sort((a, b) => words[a].startMs - words[b].startMs);
}

// Index of the word playing at `ms`, or -1 during silence.
export function findActiveWord(words: Word[], order: number[], ms: number): number {
  let lo = 0;
  let hi = order.length - 1;
  let hit = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (words[order[mid]].startMs <= ms) {
      hit = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (hit === -1) return -1;
  const i = order[hit];
  return ms < words[i].endMs ? i : -1;
}
