# Call Autopsy: review room

A review room for replaying a voice-agent call and finding the moment it went wrong. Built for Part 1 of the Hams.AI Senior Frontend take-home.

## Run it

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # vitest, tests live in tests/
pnpm build
pnpm gen:long   # regenerate the 45-minute call (macOS only, uses `say`)
```

Stack: Next.js 16 (App Router), React 19 with the React Compiler, TypeScript, Tailwind 4, Vitest. There is no backend. `/` lists the calls:

- `/calls/sample`: the real recorded call (`public/sample.wav`, `public/transcript.json`, `data/latency.json`).
- `/calls/long`: a generated 45-minute, 1,214-turn call (`public/calls/long.m4a`, `data/long/`).

## Status

| #   | Must-have                     | Status                                                                                          |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | Player and transcript in sync | Done                                                                                            |
| 2   | Where did the time go?        | Done: per-turn stage bar + whole-call breakdown from real platform data. Tool timings are dummy |
| 3   | Arabic-aware search           | Not started                                                                                     |
| 4   | Long calls stay fast          | 45-min call generated and rendering; 60fps not measured yet                                     |
| 5   | Mark it and share it          | Not started                                                                                     |
| 6   | Accessible and Arabic-first   | Partial: `dir="auto"` on turns, focusable transcript, screen-reader labels on latency           |

## How it works

### Data: `src/lib/call.ts`, `src/lib/calls.ts`

`calls.ts` is the list of calls. Each entry names its audio, transcript, latency report, tool data and time scale, and `loadCall(id)` turns them into a `CallRecord` plus per-turn latencies. `/calls/[id]` prerenders one page per entry.

`call.ts` has the brief's `CallRecord` types, plus `fromTranscript`, which converts the platform's transcript format into them:

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

### Where did the time go?: `src/lib/latency.ts`

For the sample call: real platform data from `data/latency.json`, plus dummy tool timings from `data/tools.json`. The long call uses generated data in the same shape.

- **Perceived latency** is the platform's `ub_latency_ms`: from `user_stops_speaking` to `bot_starts_speaking`.
- **Stages** are `last_stt_ms` → `last_llm_ms` → tool → `first_tts_ms`. Speech recognition, model and first-audio times add up exactly to `total_latency_ms_per_turn`.
- **Network / other** is `network_latency_ms` minus any tool time: whatever the platform measured end to end but no stage accounts for.
- **Matching:** the report uses its own turn ids, so `matchLatencies` pairs each entry with the agent turn that started closest to `bot_starts_speaking`, within 2.5s and using each turn once. All 29 entries match; 28 of them are ~100ms before the transcript's start time.
- **Per turn:** a badge (red at 1s or more) plus a stacked bar. Every bar shares the call's max latency as its scale, so a slow turn is visibly long. Any turn with a tool call shows a chip: wrench icon, tool name, and ✓ success, ✕ failed or ⏱ timed out. Status is shown by the icon and label, not only by colour. Hovering shows the breakdown, and screen readers get it as text.
- **Whole call:** avg / p50 / p99 / max tiles, plus one bar of the total time per stage, with a legend that lists every value and percentage.
- Stats use nearest-rank percentiles, so p99 is always a value that was actually observed.

On the sample call: 29 replies, avg 701ms (matches the platform's own `average_perceived_latency_ms_per_call`), p50 603ms, max 2.5s. Speech recognition is 51% of all waiting.

| Turn | What the breakdown shows                                                             |
| ---- | ------------------------------------------------------------------------------------ |
| 22   | 2.5s: `search_flights` (dummy, 1.9s) fills the gap the platform couldn't account for |
| 42   | 1.7s: 1.26s unaccounted, after the misheard "Professor", with no tool involved       |
| 62   | `get_cancellation_policy` error (dummy), so the agent says it has no access          |

### The 45-minute call: `scripts/generate-long-call.mjs`

Run `pnpm gen:long` to rebuild `public/calls/long.m4a` and `data/long/{transcript,latency,tools}.json`. It's macOS only and takes ~40s. The outputs are committed, so reviewers don't need to run it.

**How the audio is made.** The audio, the transcript and the latency report all come from one loop with one clock, so they can't disagree.

1. **Text to speech.** macOS `say` speaks each line:
   `say -v <voice> -r <wpm> -o clip.wav --data-format=LEI16@22050 "<text>"`
   The agent uses Samantha, English customer lines use Tara (en-IN), and Arabic customer lines use Majed. Speeds are 200–225 wpm, so ~1,200 turns fit in 45 minutes.
2. **Cache.** There are only ~40 unique lines. Each clip is cached in the OS temp folder under a hash of voice, speed and text, so repeated lines aren't spoken again.
3. **Read and trim.** The script reads the raw 16-bit samples from the WAV's `data` section. It then cuts `say`'s leading and trailing silence (samples quieter than 300 of 32,767), so turn boundaries sit on the actual speech.
4. **Timeline.** One `cursor` (ms) moves forward through the call:
   ```
   greeting
   repeat until 45:00:
     customer thinks  cursor += 350–800ms                        (silence)
     customer speaks  clip at cursor, cursor += clip length
     agent latency    cursor += stt + llm + tool + tts + network  (silence)
     agent speaks     clip at cursor, cursor += clip length
   ```
   Every clip placed at `cursor` also becomes a transcript turn with the same start and end. `user_stops_speaking` and `bot_starts_speaking` in the latency report are the cursor before and after the latency gap. So a 6.1s latency in the data is 6.1s of real silence in the audio.
5. **Mix.** A 45-minute `Int16Array` of zeros (silence) is created, and each clip is copied in at its exact sample offset. No audio tool does the joining, so nothing rounds positions or drifts across 1,214 clips.
6. **Encode.** The buffer is piped to `ffmpeg -f s16le -ar 22050 -ac 1 -i pipe:0 -c:a aac -b:a 32k`, which turns 119MB of raw audio into a 9MB `.m4a`. I chose AAC in `.m4a` over MP3 because browsers seek it more accurately, and click-to-seek depends on that.
7. **Verify.** `ffmpeg -af silencedetect` over the output finds the bad moment's silence at 1888.14s → 1894.23s. That's the same start and end as the transcript turns on either side of it.

**What's in the call.**

- **Script:** 19 short customer/agent exchanges, picked at random with a fixed seed, so every run produces the same call. The Arabic lines come from the brief: hamza and no-hamza spellings, Arabic-Indic digits, and mixed Arabic/English in one sentence. That's also test data for search later.
- **Latency:** a report in the same shape as the real `data/latency.json`. Values are drawn close to the real call's (p50 649ms vs 603ms real), with rare speech-recognition and model spikes. Tool calls happen on fare, seat and booking questions, and ~8% of them fail. As on the real platform, tool time is counted inside `network_latency_ms`.
- **The bad moment, at 31:28:** the customer asks in Arabic to change their flight (`أبي أغير رحلتي من الرياض لجدة، الحجز رقم 2Q7HX`). `change_booking` times out after 5.5s, and the caller hears **6.1s of silence**. Then the agent says it's having trouble and hands over to a colleague.
- **Result:** 1,214 turns, 606 agent replies (42 at 1s or more), 195 tool calls, 45:00 of audio.
- **Limits:** word timings inside a turn are still estimated from word length, the voices sound robotic, and generation needs macOS.

## Key decisions and trade-offs

- **`requestAnimationFrame` over `timeupdate`.** `timeupdate` fires about 4 times a second, which makes the highlight lag and step. rAF follows the display refresh rate, and it only runs while playing.
- **Changing classes directly instead of React state for the active word.** Putting `currentTime` in state re-renders every word several times a second, which breaks on a 1,200-turn call. The trade-off is that the highlight lives outside React, so it has to be kept in step by index.
- **Binary search over a sorted index.** Turns can overlap (barge-ins), so the flat word list isn't guaranteed to be sorted. Sorting indices once keeps the search correct.
- **Auto-scroll only outside the middle band.** Scrolling on every word makes the view jitter. Scrolling only when the word leaves the middle 50% keeps it calm.
- **Time scale 1.131 for the sample call (`src/lib/calls.ts`).** The transcript covers ~258s but the wav is ~294s. I matched turn starts to the silences `ffmpeg silencedetect` found and settled on one linear factor. Without it, the highlight ends up ~36s ahead of the voice by the end of the call.
- **Per-turn aggregates, not the brief's `PipelineEvent` stream.** The real platform reports latency per turn, so I model that directly instead of inventing events to fit the brief's shape. `CallRecord.events` stays empty.
- **Latency from the platform, not transcript gaps.** Transcript gaps said ~150ms. The platform's `user_stops_speaking` lands ~400ms before the transcript's `end_time`, so the gaps undercounted by ~4×.
- **Tool time carved out of `network_latency_ms`.** The platform has no tool spans. A slow tool shows up as unaccounted time, so dummy tool durations are taken from that remainder rather than added on top. That keeps the total equal to what the caller heard.
- **Generated audio instead of looping `sample.wav`.** Looping the real recording gives ~600 turns in 45 minutes, not ~1,200, and the transcript wouldn't match the words. Synthesising the audio lets every word in the transcript actually be spoken at its timestamp.
- **Both calls prerender as static pages.** The long page is 2.4MB of HTML (200KB gzipped), because every word is a span. Virtualising the transcript would cut this, but it would complicate the word-index-to-span mapping the sync relies on, so I've left it until the 60fps measurement says it's needed.

## Assumptions

- Word timings are estimated from character counts. Sync is correct at turn boundaries and approximate inside a turn. Real speech-recognition word timings would work without code changes.
- One linear scale is enough to line the sample transcript up with its audio. Some turns may still be a few hundred ms early or late.
- Tool data is made up (`data/tools.json`); every other latency number is real. Each tool's duration fits inside that turn's `network_latency_ms`.
- Latency report turn 15 matches transcript turn 31 with a 1.85s offset, not the usual ~100ms. That's the barge-in, where the agent started talking over the caller.

## What I cut, and why

- **Search, marks, share links, i18n, keyboard shortcuts, playback speed**: not started.

## How I'll verify 60fps (not yet measured)

1. Open `/calls/long`.
2. Record a Chrome Performance trace during playback. Frames should stay under 16ms, with no long tasks.
3. Use the React DevTools Profiler to confirm there are **zero commits** during playback. Only class changes should happen.

## Next with another week

- A latency strip across the call's length above the transcript: one tick per reply, red when slow, click to seek. On the long call, it takes you straight to 31:28 without scrolling ~850 turns.
- Use `data/turns.csv` (`barge_in`) for the overlap stretch goal.
- Arabic normalisation (hamza, ta marbuta, alef maqsura, diacritics, tatweel, Arabic-Indic digits) as a pure function with tests, plus search that jumps to the result's time.
- Virtualise the transcript for the 45-minute call, keeping the index-to-span mapping by turn.
- Marks on a timeline, with the call time and mark id stored in the URL so a share link opens at the right moment.
- Keyboard shortcuts that don't clash with screen readers, playback speed, an EN/AR UI with `dir` switching.
- A lower-confidence word stretch goal ("misheard vs misunderstood").

## Decision log

| Decision                                                      | Why                                                     | Commit |
| ------------------------------------------------------------- | ------------------------------------------------------- | ------ |
| rAF loop + direct class change for the active word            | Avoid re-rendering the whole transcript during playback | _TODO_ |
| Linear time scale to line the sample transcript up with audio | Transcript and wav durations drift ~13%                 | _TODO_ |
| _Changed:_ turn-gap latency → platform `ub_latency_ms`        | Gaps undercounted by ~4× once real data arrived         | _TODO_ |
| _Changed my mind:_ _TODO_                                     | _TODO_                                                  | _TODO_ |
