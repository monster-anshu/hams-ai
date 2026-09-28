import type { RefObject } from "react";
import { format, type Messages } from "@/lib/i18n";
import { formatMs, nextSlowReply, type SlowReply } from "@/lib/latency";
import { seekTo } from "@/lib/player";
import { stepSpeed } from "@/lib/shortcuts";
import { formatTime } from "@/lib/time";

// Start a second before the silence, so you hear the caller finish and the gap begin.
const LEAD_MS = 1000;

export function usePlayerActions(audioRef: RefObject<HTMLAudioElement | null>, slow: SlowReply[], m: Messages, announce: (text: string) => void) {
  const withAudio = (fn: (audio: HTMLAudioElement) => void) => () => audioRef.current && fn(audioRef.current);
  const now = (audio: HTMLAudioElement) => audio.currentTime * 1000;

  const changeSpeed = (direction: 1 | -1) =>
    withAudio((audio) => {
      audio.playbackRate = stepSpeed(audio.playbackRate, direction);
      announce(format(m.speedIs, { speed: audio.playbackRate }));
    });

  return {
    playPause: withAudio((audio) => {
      if (audio.paused) void audio.play();
      else audio.pause();
      announce(audio.paused ? m.paused : m.playing);
    }),
    back: withAudio((audio) => seekTo(audio, now(audio) - 5000)),
    forward: withAudio((audio) => seekTo(audio, now(audio) + 5000)),
    slower: changeSpeed(-1),
    faster: changeSpeed(1),
    nextSlow: withAudio((audio) => {
      const reply = nextSlowReply(slow, now(audio) + LEAD_MS + 100);
      if (!reply) return announce(m.noSlow);
      seekTo(audio, reply.silenceStartMs - LEAD_MS);
      announce(format(m.slowAt, { time: formatTime(reply.silenceStartMs), latency: formatMs(reply.latency.perceivedMs) }));
    }),
  };
}
