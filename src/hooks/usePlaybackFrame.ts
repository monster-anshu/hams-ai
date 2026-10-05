import { useEffect, useEffectEvent, type RefObject } from "react";

// Calls onFrame(ms) every animation frame while playing, and once on pause, seek and load.
export function usePlaybackFrame(
  audioRef: RefObject<HTMLAudioElement | null>,
  onFrame: (ms: number) => void,
) {
  const frame = useEffectEvent(onFrame);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let raf = 0;
    const tick = () => frame(audio.currentTime * 1000);
    const loop = () => {
      tick();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      loop();
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      tick();
    };

    audio.addEventListener("play", start);
    audio.addEventListener("pause", stop);
    audio.addEventListener("seeked", tick);
    audio.addEventListener("loadedmetadata", tick);
    if (audio.paused) tick();
    else start();

    return () => {
      cancelAnimationFrame(raf);
      audio.removeEventListener("play", start);
      audio.removeEventListener("pause", stop);
      audio.removeEventListener("seeked", tick);
      audio.removeEventListener("loadedmetadata", tick);
    };
  }, [audioRef]);
}
