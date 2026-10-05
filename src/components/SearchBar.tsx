"use client";

import {
  useDeferredValue,
  useState,
  type KeyboardEvent,
  type Ref,
} from "react";
import { useLocale } from "@/hooks/useLocale";
import { useSearchHighlight } from "@/hooks/useSearchHighlight";
import { format } from "@/lib/i18n";
import { search, type SearchIndex } from "@/lib/search";
import { keysFor } from "@/lib/shortcuts";
import { formatTime } from "@/lib/time";

type Props = {
  index: SearchIndex;
  inputRef: Ref<HTMLInputElement>;
  onJump: (ms: number) => void;
};

export function SearchBar({ index, inputRef, onJump }: Props) {
  const { m } = useLocale();
  const [query, setQuery] = useState("");
  // null until the first jump, so the first Enter lands on result 1.
  const [position, setPosition] = useState<number | null>(null);
  const deferredQuery = useDeferredValue(query);
  const results = search(index, deferredQuery);
  const current = results[position ?? 0];

  useSearchHighlight(results, current);

  const go = (step: 1 | -1) => {
    if (results.length === 0) return;
    const next =
      position === null
        ? step === 1
          ? 0
          : results.length - 1
        : (position + step + results.length) % results.length;
    setPosition(next);
    onJump(results[next].startMs);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter") go(e.shiftKey ? -1 : 1);
    if (e.key === "Escape") setQuery("");
  };

  const button =
    "rounded-md border border-zinc-500/30 px-2 py-1 text-sm hover:bg-zinc-500/10 disabled:opacity-40";

  return (
    <search className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPosition(null);
        }}
        onKeyDown={onKey}
        dir="auto"
        placeholder={m.searchPlaceholder}
        aria-label={m.search}
        aria-keyshortcuts={keysFor("search")}
        className="min-w-0 flex-1 rounded-md border border-zinc-500/30 bg-transparent px-3 py-1.5"
      />
      <button
        type="button"
        onClick={() => go(-1)}
        disabled={!results.length}
        aria-label={m.prevResult}
        className={button}
      >
        <span aria-hidden className="inline-block rtl:rotate-180">
          ↑
        </span>
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        disabled={!results.length}
        aria-label={m.nextResult}
        className={button}
      >
        <span aria-hidden className="inline-block rtl:rotate-180">
          ↓
        </span>
      </button>
      <p aria-live="polite" className="min-w-24 text-sm text-zinc-500">
        {deferredQuery.trim() &&
          (current
            ? format(m.resultOf, {
                n: (position ?? 0) + 1,
                total: results.length,
                time: formatTime(current.startMs),
              })
            : m.noResults)}
      </p>
    </search>
  );
}
