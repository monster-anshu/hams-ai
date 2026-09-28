import { useEffect } from "react";
import type { SearchResult } from "@/lib/search";

// Same trick as the active word: toggle classes on existing spans instead of re-rendering the transcript.
export function useSearchHighlight(results: SearchResult[], current: SearchResult | undefined) {
  useEffect(() => {
    const spans = document.querySelectorAll<HTMLElement>("[data-transcript] [data-word]");
    const touched: HTMLElement[] = [];
    const mark = (r: SearchResult, className: string) => {
      for (let i = r.wordIndex; i < r.wordIndex + r.wordCount; i++) {
        spans[i]?.classList.add(className);
        touched.push(spans[i]);
      }
    };

    results.forEach((r) => mark(r, "word-match"));
    if (current) {
      mark(current, "word-match-current");
      spans[current.wordIndex]?.scrollIntoView({ block: "center" });
    }

    return () => touched.forEach((el) => el?.classList.remove("word-match", "word-match-current"));
  }, [results, current]);
}
