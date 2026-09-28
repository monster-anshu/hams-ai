import { toLatinDigits } from "./arabic";

export function formatTime(ms: number, tenths = false) {
  const s = Math.floor(ms / 1000);
  const base = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return tenths ? `${base}.${Math.floor((ms % 1000) / 100)}` : base;
}

// Parses "m:ss" or "m:ss.d", in Latin or Arabic-Indic digits. Returns null when invalid.
export function parseTime(input: string): number | null {
  const match = toLatinDigits(input.trim()).match(/^(\d+):([0-5]\d)(?:\.(\d))?$/);
  if (!match) return null;
  const [, m, s, tenths = "0"] = match;
  return (Number(m) * 60 + Number(s)) * 1000 + Number(tenths) * 100;
}
