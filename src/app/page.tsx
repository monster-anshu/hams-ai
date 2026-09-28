import { CallReview } from "@/components/CallReview";
import { fromTranscript, type RawTranscript } from "@/lib/call";
import { matchLatencies, type LatencyReport, type ToolReport } from "@/lib/latency";
import latencyReport from "../../data/latency.json";
import toolReport from "../../data/tools.json";
import raw from "../../public/transcript.json";

// Transcript timestamps run ~13% faster than sample.wav; this lines turn starts up with the audio's silences.
const AUDIO_SCALE = 1.131;

export default function Home() {
  const transcript = raw as RawTranscript;
  const call = fromTranscript(transcript, "/sample.wav", AUDIO_SCALE);
  const latencies = matchLatencies(latencyReport as LatencyReport, transcript.response.turns, toolReport as ToolReport);
  return <CallReview call={call} latencies={latencies} />;
}
