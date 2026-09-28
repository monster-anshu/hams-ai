import { useSyncExternalStore } from "react";
import { parseMarks, type Mark } from "@/lib/marks";

const EVENT = "hams:marks-change";
const EMPTY: Mark[] = [];
const cache = new Map<string, { raw: string | null; marks: Mark[] }>();

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

// useSyncExternalStore needs a stable snapshot, so re-parse only when the stored string changes.
function read(key: string) {
  const raw = localStorage.getItem(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.marks;
  const marks = parseMarks(raw);
  cache.set(key, { raw, marks });
  return marks;
}

export function useMarks(callId: string) {
  const key = `hams:marks:${callId}`;
  const marks = useSyncExternalStore(subscribe, () => read(key), () => EMPTY);

  const write = (next: Mark[]) => {
    localStorage.setItem(key, JSON.stringify(next.toSorted((a, b) => a.startMs - b.startMs)));
    window.dispatchEvent(new Event(EVENT));
  };

  return {
    marks,
    add: (mark: Mark) => write([...marks, mark]),
    remove: (id: string) => write(marks.filter((m) => m.id !== id)),
  };
}
