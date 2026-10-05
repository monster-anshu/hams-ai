import type { RawTurn, Turn } from "./call";
import type { Messages } from "./i18n";

export const SLOW_MS = 1000;

// Pipeline order: speech recognition → first model token → tools → first audio.
// "other" is whatever the platform measured end to end but no stage accounts for.
export const STAGES = ["stt", "llm", "tool", "tts", "other"] as const;
export type Stage = (typeof STAGES)[number];

export type ToolStatus = "ok" | "error" | "timeout";

export type TurnLatency = {
  perceivedMs: number;
  stages: Record<Stage, number>;
  tool?: { name: string; status: ToolStatus };
};

type RawLatencyTurn = {
  turn_id: string;
  ub_latency_ms: number;
  bot_starts_speaking: string;
  last_stt_ms: number;
  last_llm_ms: number;
  first_tts_ms: number;
  network_latency_ms: number;
};

export type LatencyReport = { response: { turns: RawLatencyTurn[] } };
export type ToolReport = {
  tools: {
    turn_id: string;
    name: string;
    status: ToolStatus;
    duration_ms: number;
  }[];
};

const MATCH_WINDOW_MS = 2500;

// The report uses its own turn ids, so each entry is paired with the agent turn
// that started closest to `bot_starts_speaking`. Result is keyed by transcript turn id.
export function matchLatencies(
  report: LatencyReport,
  turns: RawTurn[],
  tools?: ToolReport,
): Map<string, TurnLatency> {
  const agents = turns.filter((t) => t.speaker === "agent");
  const toolsByTurn = new Map(tools?.tools.map((t) => [t.turn_id, t]));
  const result = new Map<string, TurnLatency>();

  for (const entry of report.response.turns) {
    const botStart = Date.parse(entry.bot_starts_speaking);
    let best: RawTurn | undefined;
    let bestDiff = MATCH_WINDOW_MS;

    for (const turn of agents) {
      const diff = Math.abs(Date.parse(turn.start_time) - botStart);
      if (diff <= bestDiff && !result.has(String(turn.sequence_no))) {
        best = turn;
        bestDiff = diff;
      }
    }
    if (!best) continue;

    const tool = toolsByTurn.get(entry.turn_id);
    const toolMs = tool?.duration_ms ?? 0;
    result.set(String(best.sequence_no), {
      perceivedMs: entry.ub_latency_ms,
      stages: {
        stt: entry.last_stt_ms,
        llm: entry.last_llm_ms,
        tool: toolMs,
        tts: entry.first_tts_ms,
        other: Math.max(0, entry.network_latency_ms - toolMs),
      },
      tool: tool && { name: tool.name, status: tool.status },
    });
  }
  return result;
}

export function stageTotals(
  latencies: Iterable<TurnLatency>,
): Record<Stage, number> {
  const totals = { stt: 0, llm: 0, tool: 0, tts: 0, other: 0 };
  for (const { stages } of latencies) {
    for (const stage of STAGES) totals[stage] += stages[stage];
  }
  return totals;
}

export type LatencyStats = {
  count: number;
  avg: number;
  p50: number;
  p99: number;
  max: number;
  slow: number;
};

// Nearest-rank percentile on a sorted array.
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.max(0, rank - 1)];
}

export function summarize(values: number[]): LatencyStats {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    count: sorted.length,
    avg: sorted.length ? Math.round(sum / sorted.length) : 0,
    p50: percentile(sorted, 50),
    p99: percentile(sorted, 99),
    max: sorted.at(-1) ?? 0,
    slow: sorted.filter((v) => v >= SLOW_MS).length,
  };
}

export function formatMs(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

export function describeLatency(
  { perceivedMs, stages, tool }: TurnLatency,
  m: Messages,
) {
  const parts = STAGES.filter((s) => stages[s] > 0).map((s) => {
    const label =
      s === "tool" && tool ? `${tool.name} (${m[tool.status]})` : m[s];
    return `${label} ${formatMs(stages[s])}`;
  });
  return `${formatMs(perceivedMs)}: ${parts.join(", ")}`;
}

export type SlowReply = {
  turn: Turn;
  latency: TurnLatency;
  silenceStartMs: number;
};

export function slowReplies(
  turns: Turn[],
  latencies: Map<string, TurnLatency>,
): SlowReply[] {
  return turns.flatMap((turn) => {
    const latency = latencies.get(turn.id);
    if (!latency || latency.perceivedMs < SLOW_MS) return [];
    return [
      {
        turn,
        latency,
        silenceStartMs: Math.max(0, turn.startMs - latency.perceivedMs),
      },
    ];
  });
}

// First slow reply whose silence starts after `afterMs`, wrapping to the start of the call.
export function nextSlowReply(
  replies: SlowReply[],
  afterMs: number,
): SlowReply | null {
  return replies.find((r) => r.silenceStartMs > afterMs) ?? replies[0] ?? null;
}
