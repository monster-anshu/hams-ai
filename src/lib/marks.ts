export type Mark = { id: string; startMs: number; endMs: number; label: string; comment: string };

export const SHARED_MARK_ID = "shared";
const MAX_LABEL = 60;
const MAX_COMMENT = 1000;

export function overlaps(mark: Pick<Mark, "startMs" | "endMs">, startMs: number, endMs: number) {
  return startMs < mark.endMs && endMs > mark.startMs;
}

export function isSameMark(a: Mark, b: Mark) {
  return a.startMs === b.startMs && a.endMs === b.endMs && a.label === b.label;
}

// Everything the recipient needs lives in the URL: there is no backend to look a mark up in.
export function markToSearch(mark: Mark) {
  const params = new URLSearchParams({ mark: `${mark.startMs}-${mark.endMs}`, label: mark.label });
  if (mark.comment) params.set("note", mark.comment);
  return params.toString();
}

export function markFromSearch(search: string): Mark | null {
  const params = new URLSearchParams(search);
  const range = params.get("mark")?.match(/^(\d+)-(\d+)$/);
  const label = params.get("label")?.trim().slice(0, MAX_LABEL);
  if (!range || !label) return null;

  const startMs = Number(range[1]);
  const endMs = Number(range[2]);
  if (endMs <= startMs) return null;
  return { id: SHARED_MARK_ID, startMs, endMs, label, comment: (params.get("note") ?? "").slice(0, MAX_COMMENT) };
}

// Stored marks come from localStorage, so anything malformed is dropped rather than trusted.
export function parseMarks(raw: string | null): Mark[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(
      (m): m is Mark =>
        typeof m?.id === "string" &&
        Number.isFinite(m.startMs) &&
        Number.isFinite(m.endMs) &&
        m.endMs > m.startMs &&
        typeof m.label === "string" &&
        typeof m.comment === "string",
    );
  } catch {
    return [];
  }
}
