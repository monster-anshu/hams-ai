export type Word = { w: string; startMs: number; endMs: number; confidence: number };

export type Turn = {
  id: string;
  speaker: "agent" | "customer";
  startMs: number;
  endMs: number;
  text: string;
  words: Word[];
  interrupted?: boolean;
};

export type PipelineEvent = { turnId: string; atMs: number } & (
  | { type: "stt.final"; latencyMs: number }
  | { type: "llm.first_token"; latencyMs: number }
  | { type: "tool.call"; name: string; durationMs: number; status: "ok" | "error" | "timeout" }
  | { type: "tts.first_audio"; latencyMs: number }
);

export type CallRecord = {
  id: string;
  audioUrl: string;
  durationMs: number;
  turns: Turn[];
  events: PipelineEvent[];
};

type RawTurn = {
  sequence_no: number;
  speaker: "agent" | "user";
  transcript: string;
  start_time: string;
  end_time: string;
};

export type RawTranscript = { response: { call_id: string; turns: RawTurn[] } };

// `scale` stretches wall-clock timestamps onto the audio timeline when the two drift.
export function fromTranscript(raw: RawTranscript, audioUrl: string, scale = 1): CallRecord {
  const t0 = Date.parse(raw.response.turns[0].start_time);
  const toMs = (iso: string) => Math.round((Date.parse(iso) - t0) * scale);

  const turns: Turn[] = raw.response.turns.map((t) => {
    const startMs = toMs(t.start_time);
    const endMs = toMs(t.end_time);
    return {
      id: String(t.sequence_no),
      speaker: t.speaker === "user" ? "customer" : "agent",
      startMs,
      endMs,
      text: t.transcript,
      words: spreadWords(t.transcript, startMs, endMs),
    };
  });

  return {
    id: raw.response.call_id,
    audioUrl,
    durationMs: turns.at(-1)?.endMs ?? 0,
    turns,
    events: [],
  };
}

// The source has no word timings, so split each turn's span by word length.
export function spreadWords(text: string, startMs: number, endMs: number): Word[] {
  const tokens = text.split(/\s+/).filter(Boolean);
  const totalChars = tokens.reduce((n, w) => n + w.length, 0);
  const msPerChar = (endMs - startMs) / totalChars;
  let cursor = startMs;

  return tokens.map((w) => {
    const start = cursor;
    cursor += w.length * msPerChar;
    return { w, startMs: Math.round(start), endMs: Math.round(cursor), confidence: 1 };
  });
}
