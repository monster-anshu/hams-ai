import { notFound } from "next/navigation";
import { CallReview } from "@/components/CallReview";
import { CALLS, loadCall } from "@/lib/calls";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(CALLS).map((id) => ({ id }));
}

export default async function CallPage({ params }: PageProps<"/calls/[id]">) {
  const { id } = await params;
  const loaded = loadCall(id);
  if (!loaded) notFound();
  return (
    <CallReview callId={id} call={loaded.call} latencies={loaded.latencies} />
  );
}
