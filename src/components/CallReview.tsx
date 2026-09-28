"use client";

import { useRef } from "react";
import type { CallRecord } from "@/lib/call";
import type { TurnLatency } from "@/lib/latency";
import { LatencySummary } from "./LatencySummary";
import { Transcript } from "./Transcript";

export function CallReview({ call, latencies }: { call: CallRecord; latencies: Map<string, TurnLatency> }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  return (
    <main className="mx-auto flex h-dvh w-full max-w-3xl flex-col gap-4 p-6">
      <header>
        <h1 className="text-xl font-semibold">Call review</h1>
        <p className="font-mono text-xs text-zinc-500">{call.id}</p>
      </header>
      <audio ref={audioRef} src={call.audioUrl} controls preload="metadata" className="w-full" />
      <LatencySummary latencies={[...latencies.values()]} />
      <Transcript call={call} latencies={latencies} audioRef={audioRef} />
    </main>
  );
}
