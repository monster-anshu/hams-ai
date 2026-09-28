import { CallList } from "@/components/CallList";
import { CALLS } from "@/lib/calls";

export default function Home() {
  const calls = Object.entries(CALLS).map(([id, source]) => ({
    id,
    titleKey: source.titleKey,
    turns: source.transcript.response.turns.length,
  }));
  return <CallList calls={calls} />;
}
