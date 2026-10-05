// Alt+Shift chords: screen readers use single letters (browse mode) and Insert/CapsLock or
// Ctrl+Option, so these don't collide. Matching on `code` keeps them working on an Arabic layout.
export const SHORTCUTS = [
  { action: "playPause", code: "KeyK", keys: "Alt+Shift+K" },
  { action: "back", code: "KeyJ", keys: "Alt+Shift+J" },
  { action: "forward", code: "KeyL", keys: "Alt+Shift+L" },
  { action: "slower", code: "Comma", keys: "Alt+Shift+," },
  { action: "faster", code: "Period", keys: "Alt+Shift+." },
  { action: "nextSlow", code: "KeyN", keys: "Alt+Shift+N" },
  { action: "newMark", code: "KeyM", keys: "Alt+Shift+M" },
  { action: "search", code: "KeyF", keys: "Alt+Shift+F" },
] as const;

export type ShortcutAction = (typeof SHORTCUTS)[number]["action"];

type Chord = Pick<
  KeyboardEvent,
  "code" | "altKey" | "shiftKey" | "ctrlKey" | "metaKey"
>;

export function shortcutAction(e: Chord): ShortcutAction | null {
  if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return null;
  return SHORTCUTS.find((s) => s.code === e.code)?.action ?? null;
}

export function keysFor(action: ShortcutAction) {
  return SHORTCUTS.find((s) => s.action === action)!.keys;
}

export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function stepSpeed(current: number, direction: 1 | -1) {
  const i = SPEEDS.findIndex((s) => s >= current);
  const index = i === -1 ? SPEEDS.length - 1 : i;
  return SPEEDS[Math.min(SPEEDS.length - 1, Math.max(0, index + direction))];
}
