import { useEffect, useState } from "react";
import type { Turn } from "@/lib/call";

type Range = { startMs: number; endMs: number };

// Remembers the last text selection inside the transcript as a time range.
// Kept after the selection collapses, because clicking a button can clear it first.
export function useTranscriptSelection(turns: Turn[]) {
  const [range, setRange] = useState<Range | null>(null);

  useEffect(() => {
    const onChange = () => {
      const next = readSelection(turns);
      if (next) setRange(next);
    };
    document.addEventListener("selectionchange", onChange);
    return () => document.removeEventListener("selectionchange", onChange);
  }, [turns]);

  return [range, () => setRange(null)] as const;
}

function readSelection(turns: Turn[]): Range | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.rangeCount) return null;
  const range = selection.getRangeAt(0);
  const root = document.querySelector("[data-transcript]");
  if (!root?.contains(range.commonAncestorContainer)) return null;

  const node = range.commonAncestorContainer;
  const el = node instanceof Element ? node : node.parentElement!;
  const single = el.closest<HTMLElement>("[data-word]");
  const hits = single
    ? [single]
    : [...el.querySelectorAll<HTMLElement>("[data-word]")].filter((w) =>
        range.intersectsNode(w),
      );
  if (hits.length === 0) return null;

  const starts = hits.map((w) => Number(w.dataset.start));
  const lastStart = Math.max(...starts);
  const lastWord = turns
    .flatMap((t) => t.words)
    .find((w) => w.startMs === lastStart);
  return { startMs: Math.min(...starts), endMs: lastWord?.endMs ?? lastStart };
}
