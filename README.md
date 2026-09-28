# Call Autopsy: review room

A review room for replaying a voice-agent call and finding the moment it went wrong. Built for Part 1 of the Hams.AI Senior Frontend take-home.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # vitest, tests live in tests/
pnpm build
```

Stack: Next.js 16 (App Router), React 19 with the React Compiler, TypeScript, Tailwind 4, Vitest. There is no backend. The call loads from `public/transcript.json` and `public/sample.wav`.

## Status

| # | Must-have | Status |
|---|---|---|
| 1 | Player and transcript in sync | Done |
| 2 | Where did the time go? | Partial: perceived latency per turn plus call summary (avg, p50, p99, max). No stage breakdown yet |
| 3 | Arabic-aware search | Not started |
| 4 | Long calls stay fast | Engine designed for it; 45-min call not generated or measured yet |
| 5 | Mark it and share it | Not started |
| 6 | Accessible and Arabic-first | Partial: `dir="auto"` on turns, focusable transcript, screen-reader labels on latency |

## How it works

### Data: `src/lib/call.ts`

The brief's `CallRecord` types, plus `fromTranscript`, which converts the sample transcript format into them:

- ISO timestamps become milliseconds from the first turn.
- `user` becomes `customer`.
- The sample has no word timings, so `spreadWords` splits each turn's time across its words by character count. Longer words get more time.

### Player and transcript sync

```
play ─► requestAnimationFrame loop
          └─ audio.currentTime ─► binary search ─► index changed?
               ├─ no  → nothing
               └─ yes → move .word-active class (2 DOM nodes)
                        └─ following? → scroll if word left the middle band
```

- **Render once.** `TurnList` renders every word as a `<span data-start>`. None of its props change during playback, so React never re-renders the transcript while audio plays.
- **Find the word.** `useActiveWord` reads `currentTime` every frame while playing, plus once on `pause` and `seeked`. `findActiveWord` binary-searches words sorted by `startMs`, which takes about 14 steps for 12k words. If the playhead is in silence between words, it returns `-1` and nothing is highlighted.
- **Paint.** The callback fires only when the index changes (about 3 times a second). It moves one CSS class. Word `i` in the flat word list is span `i` in the page, so no DOM search is needed.
- **Seek.** A single delegated click handler reads `data-start` from the clicked word or turn timestamp and sets `audio.currentTime`. The browser fires `seeked`, and the highlight follows.
- **Follow without fighting.** `useFollowPlayback` stops following only on actions a person takes: wheel, touch, scroll keys, or dragging the scrollbar. Our own `scrollIntoView` calls don't count. A "Back to playback" button, or clicking any word, turns following back on.

### Perceived latency: `src/lib/latency.ts`

Perceived latency is measured from the end of the customer's last turn to the start of the agent's reply.

- Consecutive customer turns: measured from the last one.
- Negative gaps (the agent talking over the caller) are overlaps, not latency, so they're excluded.
- Stats use nearest-rank percentiles, so p99 is always a value that was actually observed.
- Replies of 1s or more are flagged red.

On the sample call there are 28 replies: avg ~268ms, p50 144ms, p99/max 2.4s. The slowest is turn 22, where the agent searches for flights.

## Key decisions and trade-offs

- **`requestAnimationFrame` over `timeupdate`.** `timeupdate` fires about 4 times a second, which makes the highlight lag and step. rAF follows the display refresh rate, and it only runs while playing.
- **Changing classes directly instead of React state for the active word.** Putting `currentTime` in state re-renders every word several times a second, which breaks on a 1,200-turn call. The trade-off is that the highlight lives outside React, so it has to be kept in step by index.
- **Binary search over a sorted index.** Turns can overlap (barge-ins), so the flat word list isn't guaranteed to be sorted. Sorting indices once keeps the search correct.
- **Auto-scroll only outside the middle band.** Scrolling on every word makes the view jitter. Scrolling only when the word leaves the middle 50% keeps it calm.
- **`AUDIO_SCALE = 1.131` in `page.tsx`.** The transcript covers ~258s but the wav is ~294s. I matched turn starts to the silences `ffmpeg silencedetect` found and settled on one linear factor. Without it, the highlight ends up ~36s ahead of the voice by the end of the call.
- **Perceived latency from turn gaps, not pipeline events.** The sample has no `events`, so turn gaps are the only real signal. See the assumptions below.

## Assumptions

- Word timings are estimated from character counts. Sync is correct at turn boundaries and approximate inside a turn. Real speech-recognition word timings would work without code changes.
- One linear scale is enough to line the transcript up with the audio. Some turns may still be a few hundred ms early or late.
- The customer's `end_time` in the transcript is probably when speech recognition finalised, not when the caller stopped talking. The audio has ~2s silences at most speaker changes, but the transcript shows ~150ms gaps. So perceived latency here is likely **under-reported**.

## What I cut, and why

- **Pipeline stage breakdown** (speech recognition → first token → tools → first audio): needs made-up `events`. I did turn-level perceived latency first because it's what the caller actually hears.
- **45-minute call**: not generated yet, so the 60fps claim isn't measured yet (see below).
- **Search, marks, share links, i18n, keyboard shortcuts, playback speed**: not started.

## How I'll verify 60fps (not yet measured)

1. Generate a 45-minute call with ~1,200 turns.
2. Record a Chrome Performance trace during playback. Frames should stay under 16ms, with no long tasks.
3. Use the React DevTools Profiler to confirm there are **zero commits** during playback. Only class changes should happen.

## Next with another week

- Generate `events`, including the hidden tool-call timeout with ~6s of silence, and show a stacked stage bar per turn plus a whole-call breakdown.
- Arabic normalisation (hamza, ta marbuta, alef maqsura, diacritics, tatweel, Arabic-Indic digits) as a pure function with tests, plus search that jumps to the result's time.
- Virtualise the transcript for the 45-minute call, keeping the index-to-span mapping by turn.
- Marks on a timeline, with the call time and mark id stored in the URL so a share link opens at the right moment.
- Keyboard shortcuts that don't clash with screen readers, playback speed, an EN/AR UI with `dir` switching.
- A lower-confidence word stretch goal ("misheard vs misunderstood").

## Decision log

| Decision | Why | Commit |
|---|---|---|
| rAF loop + direct class change for the active word | Avoid re-rendering the whole transcript during playback | _TODO_ |
| Linear `AUDIO_SCALE` to line the transcript up with the audio | Transcript and wav durations drift ~13% | _TODO_ |
| Exclude negative gaps from latency stats | They're overlaps, and would drag the average down | _TODO_ |
| _Changed my mind:_ _TODO_ | _TODO_ | _TODO_ |
