import longLatency from "../../data/long/latency.json";
import longTools from "../../data/long/tools.json";
import longTranscript from "../../data/long/transcript.json";
import sampleLatency from "../../data/latency.json";
import sampleTools from "../../data/tools.json";
import sampleTranscript from "../../public/transcript.json";
import { fromTranscript, type RawTranscript } from "./call";
import type { Messages } from "./i18n";
import { matchLatencies, type LatencyReport, type ToolReport } from "./latency";

type CallSource = {
  titleKey: keyof Messages;
  audioUrl: string;
  transcript: RawTranscript;
  latency: LatencyReport;
  tools: ToolReport;
  // Stretches transcript time onto the audio when the two clocks drift.
  scale: number;
};

export const CALLS: Record<string, CallSource> = {
  sample: {
    titleKey: "sampleCall",
    audioUrl: "/sample.wav",
    transcript: sampleTranscript as RawTranscript,
    latency: sampleLatency as LatencyReport,
    tools: sampleTools as ToolReport,
    // Sample transcript timestamps run ~13% faster than sample.wav.
    scale: 1.131,
  },
  long: {
    titleKey: "longCall",
    audioUrl: "/calls/long.m4a",
    transcript: longTranscript as RawTranscript,
    latency: longLatency as LatencyReport,
    tools: longTools as ToolReport,
    scale: 1,
  },
};

export function loadCall(id: string) {
  const source = CALLS[id];
  if (!source) return null;
  return {
    call: fromTranscript(source.transcript, source.audioUrl, source.scale),
    latencies: matchLatencies(
      source.latency,
      source.transcript.response.turns,
      source.tools,
    ),
  };
}
