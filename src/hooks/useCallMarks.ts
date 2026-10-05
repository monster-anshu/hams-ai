import { useState } from "react";
import {
  isSameMark,
  markFromSearch,
  SHARED_MARK_ID,
  type Mark,
} from "@/lib/marks";
import { useLocationSearch } from "./useLocationSearch";
import { useMarks } from "./useMarks";

// Saved marks plus the one from a share link, if the recipient hasn't saved it yet.
export function useCallMarks(callId: string) {
  const { marks: saved, add, remove } = useMarks(callId);
  const search = useLocationSearch();
  const fromLink = markFromSearch(search);
  const savedMatch =
    fromLink && saved.find((mark) => isSameMark(mark, fromLink));
  const shared = fromLink && !savedMatch ? fromLink : null;
  const [picked, setPicked] = useState<string | null>(null);

  return {
    marks: shared ? [...saved, shared] : saved,
    fromLink,
    activeMarkId: picked ?? savedMatch?.id ?? (shared ? SHARED_MARK_ID : null),
    select: setPicked,
    save(mark: Mark) {
      add(mark);
      setPicked(mark.id);
    },
    saveShared() {
      if (!shared) return;
      const mark = { ...shared, id: crypto.randomUUID() };
      add(mark);
      setPicked(mark.id);
    },
    remove,
  };
}
