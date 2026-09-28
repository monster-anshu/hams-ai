"use client";

import { useLocale } from "@/hooks/useLocale";
import { SHARED_MARK_ID, type Mark } from "@/lib/marks";
import { formatTime } from "@/lib/time";

type Props = {
  marks: Mark[];
  activeMarkId: string | null;
  onSelect: (mark: Mark) => void;
  onCopy: (mark: Mark) => void;
  onDelete: (id: string) => void;
  onSaveShared: () => void;
};

const small = "rounded border border-zinc-500/30 px-2 py-0.5 text-xs hover:bg-zinc-500/10";

export function MarkList({ marks, activeMarkId, onSelect, onCopy, onDelete, onSaveShared }: Props) {
  const { m } = useLocale();
  if (marks.length === 0) return <p className="text-sm text-zinc-500">{m.noMarks}</p>;

  return (
    <ul className="flex flex-col gap-2">
      {marks.map((mark) => {
        const active = mark.id === activeMarkId;
        const shared = mark.id === SHARED_MARK_ID;
        return (
          <li key={mark.id} className={`flex flex-col gap-1 rounded-lg border p-2 ${active ? "border-indigo-500 bg-indigo-500/10" : "border-zinc-500/30"}`}>
            <button type="button" onClick={() => onSelect(mark)} aria-current={active || undefined} className="flex items-baseline justify-between gap-2 text-start">
              <span dir="auto" className="font-medium">
                {mark.label}
              </span>
              <span dir="ltr" className="font-mono text-xs text-zinc-500">
                {formatTime(mark.startMs)}–{formatTime(mark.endMs)}
              </span>
            </button>
            {shared && <span className="text-xs text-indigo-600 dark:text-indigo-300">{m.sharedWithYou}</span>}
            {mark.comment && (
              <p dir="auto" className="text-sm text-zinc-600 dark:text-zinc-400">
                {mark.comment}
              </p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => onCopy(mark)} className={small}>
                {m.copyLink}
              </button>
              {shared ? (
                <button type="button" onClick={onSaveShared} className={small}>
                  {m.saveShared}
                </button>
              ) : (
                <button type="button" onClick={() => onDelete(mark.id)} aria-label={`${m.deleteMark}: ${mark.label}`} className={small}>
                  {m.deleteMark}
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
