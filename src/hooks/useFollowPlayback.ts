import { useEffect, useRef, useState, type RefObject } from "react";

const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

// Stops following on user-initiated scrolls only; our own scrollIntoView calls don't count.
export function useFollowPlayback(containerRef: RefObject<HTMLElement | null>) {
  const [following, setFollowingState] = useState(true);
  const followingRef = useRef(true);

  const setFollowing = (value: boolean) => {
    followingRef.current = value;
    setFollowingState(value);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const stop = () => setFollowing(false);
    const onKey = (e: KeyboardEvent) => SCROLL_KEYS.has(e.key) && stop();
    const onPointer = (e: PointerEvent) => e.target === el && stop(); // scrollbar drag

    el.addEventListener("wheel", stop, { passive: true });
    el.addEventListener("touchmove", stop, { passive: true });
    el.addEventListener("keydown", onKey);
    el.addEventListener("pointerdown", onPointer);
    return () => {
      el.removeEventListener("wheel", stop);
      el.removeEventListener("touchmove", stop);
      el.removeEventListener("keydown", onKey);
      el.removeEventListener("pointerdown", onPointer);
    };
  }, [containerRef]);

  return { following, followingRef, setFollowing };
}
