import { useEffect, useEffectEvent } from "react";
import { shortcutAction, type ShortcutAction } from "@/lib/shortcuts";

export function useShortcuts(handlers: Record<ShortcutAction, () => void>) {
  const run = useEffectEvent((action: ShortcutAction) => handlers[action]());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const action = shortcutAction(e);
      if (!action) return;
      e.preventDefault();
      run(action);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
