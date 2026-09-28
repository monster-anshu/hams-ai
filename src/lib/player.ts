// Setting currentTime before metadata loads is unreliable, so wait for it.
export function seekTo(audio: HTMLAudioElement, ms: number) {
  const go = () => (audio.currentTime = Math.max(0, ms) / 1000);
  if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) go();
  else audio.addEventListener("loadedmetadata", go, { once: true });
}
