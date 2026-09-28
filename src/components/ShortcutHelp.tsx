"use client";

import { Fragment } from "react";
import { useLocale } from "@/hooks/useLocale";
import { SHORTCUTS, type ShortcutAction } from "@/lib/shortcuts";

export function ShortcutHelp() {
  const { m } = useLocale();
  const labels: Record<ShortcutAction, string> = {
    playPause: m.playPause,
    back: m.back,
    forward: m.forward,
    slower: m.slower,
    faster: m.faster,
    nextSlow: m.nextSlow,
    newMark: m.newMarkAtPlayhead,
  };

  return (
    <details className="rounded-lg border border-zinc-500/30 p-3 text-sm">
      <summary className="cursor-pointer font-semibold">{m.shortcuts}</summary>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {SHORTCUTS.map((s) => (
          <Fragment key={s.action}>
            <dt>
              <kbd dir="ltr" className="rounded bg-zinc-500/15 px-1.5 font-mono text-xs">
                {s.keys}
              </kbd>
            </dt>
            <dd>{labels[s.action]}</dd>
          </Fragment>
        ))}
      </dl>
    </details>
  );
}
