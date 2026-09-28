"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCallMarks } from "@/hooks/useCallMarks";
import { useLocale } from "@/hooks/useLocale";
import { usePlayerActions } from "@/hooks/usePlayerActions";
import { useShortcuts } from "@/hooks/useShortcuts";
import type { CallRecord } from "@/lib/call";
import { format } from "@/lib/i18n";
import { slowReplies, type TurnLatency } from "@/lib/latency";
import { markToSearch, type Mark } from "@/lib/marks";
import { seekTo } from "@/lib/player";
import { LanguageToggle } from "./LanguageToggle";
import { LatencySummary } from "./LatencySummary";
import { MarkForm, type MarkFormHandle } from "./MarkForm";
import { MarkList } from "./MarkList";
import { Player } from "./Player";
import { ShortcutHelp } from "./ShortcutHelp";
import { Timeline } from "./Timeline";
import { Transcript } from "./Transcript";

type Props = { callId: string; call: CallRecord; latencies: Map<string, TurnLatency> };

export function CallReview({ callId, call, latencies }: Props) {
  const { m } = useLocale();
  const audioRef = useRef<HTMLAudioElement>(null);
  const formRef = useRef<MarkFormHandle>(null);
  const [status, setStatus] = useState("");
  const marks = useCallMarks(callId);
  const slow = slowReplies(call.turns, latencies);
  const actions = usePlayerActions(audioRef, slow, m, setStatus);
  const seek = (ms: number) => audioRef.current && seekTo(audioRef.current, ms);

  useShortcuts({ ...actions, newMark: () => formRef.current?.startAtPlayhead() });

  // A share link opens at its mark.
  const linkStart = marks.fromLink?.startMs;
  useEffect(() => {
    if (linkStart !== undefined) seek(linkStart);
  }, [linkStart]);

  const select = (mark: Mark) => {
    marks.select(mark.id);
    seek(mark.startMs);
  };

  const save = (mark: Mark) => {
    marks.save(mark);
    setStatus(format(m.markSaved, { label: mark.label }));
  };

  const copy = async (mark: Mark) => {
    await navigator.clipboard.writeText(`${location.origin}${location.pathname}?${markToSearch(mark)}`);
    setStatus(m.linkCopied);
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 p-6 lg:h-dvh lg:grid-cols-[minmax(0,1fr)_22rem]">
      <main className="flex min-h-0 flex-col gap-4">
        <header className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Link href="/" className="text-sm text-zinc-500 hover:underline">
              <span aria-hidden className="inline-block rtl:rotate-180">←</span> {m.allCalls}
            </Link>
            <h1 className="text-xl font-semibold">{m.callReview}</h1>
            <p className="font-mono text-xs text-zinc-500">{call.id}</p>
          </div>
          <LanguageToggle />
        </header>
        <Player audioRef={audioRef} src={call.audioUrl} onNextSlow={actions.nextSlow} />
        <Timeline durationMs={call.durationMs} slow={slow} marks={marks.marks} activeMarkId={marks.activeMarkId} audioRef={audioRef} onSeek={seek} />
        <p role="status" className="min-h-5 text-sm text-zinc-500">
          {status || (marks.fromLink && format(m.openedShared, { label: marks.fromLink.label }))}
        </p>
        <Transcript call={call} latencies={latencies} marks={marks.marks} activeMarkId={marks.activeMarkId} audioRef={audioRef} />
      </main>
      <aside className="flex min-h-0 flex-col gap-6 lg:overflow-y-auto">
        <LatencySummary latencies={[...latencies.values()]} />
        <section aria-labelledby="marks-heading" className="flex flex-col gap-3">
          <h2 id="marks-heading" className="text-xs font-semibold uppercase text-zinc-500">
            {m.marks}
          </h2>
          <MarkForm ref={formRef} audioRef={audioRef} turns={call.turns} durationMs={call.durationMs} onSave={save} />
          <MarkList marks={marks.marks} activeMarkId={marks.activeMarkId} onSelect={select} onCopy={copy} onDelete={marks.remove} onSaveShared={marks.saveShared} />
        </section>
        <ShortcutHelp />
      </aside>
    </div>
  );
}
