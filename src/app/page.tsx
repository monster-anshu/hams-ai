import { CallReview } from "@/components/CallReview";
import { fromTranscript, type RawTranscript } from "@/lib/call";
import raw from "../../public/transcript.json";

// Transcript timestamps run ~13% faster than sample.wav; this lines turn starts up with the audio's silences.
const AUDIO_SCALE = 1.131;

export default function Home() {
  const call = fromTranscript(raw as RawTranscript, "/sample.wav", AUDIO_SCALE);
  return <CallReview call={call} />;
}
