"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { format, type Messages } from "@/lib/i18n";
import { LanguageToggle } from "./LanguageToggle";

type Item = { id: string; titleKey: keyof Messages; turns: number };

export function CallList({ calls }: { calls: Item[] }) {
  const { m } = useLocale();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{m.calls}</h1>
        <LanguageToggle />
      </header>
      <ul className="flex flex-col gap-2">
        {calls.map((call) => (
          <li key={call.id}>
            <Link href={`/calls/${call.id}`} className="block rounded-lg border border-zinc-500/30 px-4 py-3 hover:bg-zinc-500/10">
              <span className="font-medium">{m[call.titleKey]}</span>
              <span className="ms-2 text-sm text-zinc-500">{format(m.turnsCount, { n: call.turns })}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
