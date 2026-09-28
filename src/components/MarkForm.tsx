"use client";

import { useImperativeHandle, useRef, useState, type FormEvent, type Ref, type RefObject } from "react";
import { useLocale } from "@/hooks/useLocale";
import { useTranscriptSelection } from "@/hooks/useTranscriptSelection";
import type { Turn } from "@/lib/call";
import { format, type Messages } from "@/lib/i18n";
import type { Mark } from "@/lib/marks";
import { keysFor } from "@/lib/shortcuts";
import { formatTime, parseTime } from "@/lib/time";

export type MarkFormHandle = { startAtPlayhead: () => void };

type Props = {
  ref?: Ref<MarkFormHandle>;
  audioRef: RefObject<HTMLAudioElement | null>;
  turns: Turn[];
  durationMs: number;
  onSave: (mark: Mark) => void;
};

const input = "w-full rounded-md border border-zinc-500/30 bg-transparent px-2 py-1";
const button = "rounded-md border border-zinc-500/30 px-2 py-1 text-sm hover:bg-zinc-500/10";

export function MarkForm({ ref, audioRef, turns, durationMs, onSave }: Props) {
  const { m } = useLocale();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [label, setLabel] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<keyof Messages | null>(null);
  const [selection, clearSelection] = useTranscriptSelection(turns);
  const labelRef = useRef<HTMLInputElement>(null);
  const playhead = () => (audioRef.current?.currentTime ?? 0) * 1000;

  useImperativeHandle(ref, () => ({
    startAtPlayhead() {
      const s = playhead();
      setStart(formatTime(s, true));
      setEnd(formatTime(Math.min(s + 10_000, durationMs), true));
      labelRef.current?.focus();
    },
  }));

  const applySelection = () => {
    if (!selection) return;
    setStart(formatTime(selection.startMs, true));
    setEnd(formatTime(selection.endMs + 99, true));
    clearSelection();
    labelRef.current?.focus();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const startMs = parseTime(start);
    const endMs = parseTime(end);
    if (startMs === null || endMs === null) return setError("badTime");
    if (endMs <= startMs) return setError("endBeforeStart");
    if (!label.trim()) return setError("needLabel");

    onSave({ id: crypto.randomUUID(), startMs, endMs: Math.min(endMs, durationMs), label: label.trim(), comment: comment.trim() });
    setStart("");
    setEnd("");
    setLabel("");
    setComment("");
    setError(null);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3 rounded-lg border border-zinc-500/30 p-3">
      <h3 className="text-sm font-semibold">{m.newMark}</h3>
      <div className="grid grid-cols-2 gap-2">
        <TimeField label={m.start} value={start} onChange={setStart} onPlayhead={() => setStart(formatTime(playhead(), true))} m={m} />
        <TimeField label={m.end} value={end} onChange={setEnd} onPlayhead={() => setEnd(formatTime(playhead(), true))} m={m} />
      </div>
      {selection ? (
        <button type="button" onClick={applySelection} className={button}>
          {format(m.useSelection, { range: `${formatTime(selection.startMs)}–${formatTime(selection.endMs)}` })}
        </button>
      ) : (
        <p className="text-xs text-zinc-500">{m.selectHint}</p>
      )}
      <label className="flex flex-col gap-1 text-sm">
        {m.label}
        <input ref={labelRef} value={label} onChange={(e) => setLabel(e.target.value)} list="mark-labels" dir="auto" aria-keyshortcuts={keysFor("newMark")} maxLength={60} className={input} />
      </label>
      <datalist id="mark-labels">
        {[m.labelSilence, m.labelSlowTool, m.labelMisheard, m.labelWrongAnswer].map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
      <label className="flex flex-col gap-1 text-sm">
        {m.comment}
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} dir="auto" rows={2} maxLength={1000} className={input} />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {m[error]}
        </p>
      )}
      <button type="submit" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">
        {m.saveMark}
      </button>
    </form>
  );
}

type FieldProps = { label: string; value: string; onChange: (v: string) => void; onPlayhead: () => void; m: Messages };

function TimeField({ label, value, onChange, onPlayhead, m }: FieldProps) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <label className="flex flex-col gap-1">
        {label}
        <input value={value} onChange={(e) => onChange(e.target.value)} dir="ltr" inputMode="decimal" placeholder="0:00" className={input} />
      </label>
      <button type="button" onClick={onPlayhead} aria-label={`${label}: ${m.usePlayhead}`} className={button}>
        {m.usePlayhead}
      </button>
    </div>
  );
}
