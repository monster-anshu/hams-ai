import { normalizeArabic } from "./arabic";
import type { Turn } from "./call";

export type SearchIndex = { turn: Turn; words: string[]; firstWord: number }[];

// `wordIndex` is the position in the flat word list, which is also the span's position in the page.
export type SearchResult = { turnId: string; wordIndex: number; wordCount: number; startMs: number };

// Normalise every word once, so each search is just string comparisons.
export function buildSearchIndex(turns: Turn[]): SearchIndex {
  let firstWord = 0;
  return turns.map((turn) => {
    const entry = { turn, words: turn.words.map((w) => normalizeArabic(w.w)), firstWord };
    firstWord += turn.words.length;
    return entry;
  });
}

// A match is a run of consecutive words where each word contains the matching query word.
// "Contains" is what lets "اسعار" find "الأسعار" without stripping the article.
export function search(index: SearchIndex, query: string): SearchResult[] {
  const terms = normalizeArabic(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const results: SearchResult[] = [];
  for (const { turn, words, firstWord } of index) {
    for (let i = 0; i + terms.length <= words.length; i++) {
      if (terms.every((term, j) => words[i + j].includes(term))) {
        results.push({ turnId: turn.id, wordIndex: firstWord + i, wordCount: terms.length, startMs: turn.words[i].startMs });
      }
    }
  }
  return results;
}
