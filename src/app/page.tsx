import Link from "next/link";
import { CALLS } from "@/lib/calls";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Calls</h1>
      <ul className="flex flex-col gap-2">
        {Object.entries(CALLS).map(([id, source]) => (
          <li key={id}>
            <Link href={`/calls/${id}`} className="block rounded-lg border border-zinc-200 px-4 py-3 hover:bg-zinc-50/10">
              <span className="font-medium">{source.title}</span>
              <span className="ms-2 text-sm text-zinc-500">{source.transcript.response.turns.length} turns</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
