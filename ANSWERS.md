# Answers: Parts 2 and 3

## 2.1 Review this pull request

### (1) Review comments

Thanks for getting this up quickly. The shape is right: one component, turns → words → spans. But I can't approve it yet. Two bugs break it on any call, and the rest breaks on the calls Lama actually reviews. In priority order:

**Blocking: these are bugs today**

1. **Clicking a word seeks to the wrong place.** `audio.currentTime` is in seconds and `w.startMs` is in milliseconds. So clicking a word at 0:05 asks the player for second 5,000, and it jumps to the end. That also means clicking can't have been tried on the 1-minute call. Use `audio.currentTime = w.startMs / 1000`.
2. **The listener is never removed.** The effect has no cleanup, and its deps are `[]` even though it uses `audio`. Every remount adds another `timeupdate` listener. Each one calls `setState` on an unmounted component and keeps the old tree alive. If the `audio` prop changes (the next call opens), we keep listening to the old element and the transcript freezes. Return a cleanup and put `audio` in the deps.
3. **`scrollIntoView` runs inside render.** Render has to be pure. This is a DOM side effect, and it fires on _every_ render while a word is active. It also calls `getElementById`, so on the first render it finds nothing or a stale node. It belongs in an effect, or with the highlight code (see 5).
4. **The transcript scroll fights the reviewer.** Every tick scrolls back to the playhead. So as soon as Lama scrolls up to reread something, it pulls her back down, about four times a second, with smooth scrolling on top. She can't use it while audio plays. Follow the playhead only until the user scrolls, then show a "Back to playback" button.

**Must fix before it goes near a real call**

5. **The whole transcript re-renders about four times a second.** `timeupdate` sets state, so every span re-renders on every tick. That's fine for 1 minute, roughly 150 words. Our 45-minute call has about 1,200 turns and more than 15,000 words, so that's 15,000 spans diffed four times a second. Each render also does a linear scan in which every word checks the time. It will drop frames and drain laptop batteries. Render the list once, find the active word with a binary search (words are sorted by start), and toggle one class on the old and new span. Playback should never cause a React render.
6. **`timeupdate` is too coarse for word sync.** It fires only every 250ms or so, and at an irregular rate. Arabic function words are often shorter than that, so they never light up, and the highlight visibly lags the voice. Read `currentTime` in `requestAnimationFrame` while playing, and update once more on `pause` and `seeked`.
7. **`id={`w-${startMs}`}` isn't unique.** Two words can start at the same millisecond, for example when the caller talks over the agent. Rounding or word splitting can do the same. The ids are also global to the document, so two transcripts on a page (a before/after comparison) would collide. Look spans up by index inside the component instead of by document id.
8. **`key={i}` on turns.** Turns have a stable `id`, so use it. With an index key, any insert or filter (for example search, or "show only slow turns") reuses the wrong DOM and highlight state.

**Accessibility and Arabic, also required for this panel**

9. **You can only seek with a mouse.** A `<span onClick>` can't be focused and has no role, so keyboard and screen-reader users can't seek at all. Give each turn a real `<button>` that seeks to its start, and handle word clicks with one delegated listener on the container. That's also 15k fewer closures.
10. **Arabic text has no direction.** Mixed Arabic and English turns need `dir="auto"` (or `lang`/`dir` per turn). Otherwise punctuation and numbers land on the wrong side. The panel also needs an accessible name (`<section aria-label>`).
11. **Nothing shows who is speaking.** Lama needs agent or customer on every turn.

**Nits**

- `{w.w + ' '}`: I'd render `{w.w} ` so the text node stays simple. Not a big deal.
- Pass the audio as a ref, not a DOM node in props. It's safer for server rendering, and the component doesn't have to re-subscribe on every render.
- On "tested on a 1-minute call, works": could you add a test for the active-word lookup (gaps, first word, last word, exact boundaries)? Then try the generated 45-minute call with the Performance panel open. That's the test that matters for this component.

Happy to pair on the rAF + class-toggle part if you'd like, since it's the part that isn't obvious.

### (2) The version I'd merge

<!-- prettier-ignore -->
```tsx
import { memo, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type { Turn, Word } from '../lib/call'

type Props = { turns: Turn[]; audioRef: RefObject<HTMLAudioElement | null> }
const SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']

// Binary search over words sorted by start. -1 when the playhead is in a gap.
function findWord(words: Word[], ms: number) {
  let lo = 0, hi = words.length - 1, hit = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (words[mid].startMs <= ms) { hit = mid; lo = mid + 1 } else hi = mid - 1
  }
  return hit >= 0 && ms < words[hit].endMs ? hit : -1
}

export function Transcript({ turns, audioRef }: Props) {
  const listRef = useRef<HTMLDivElement>(null)
  const following = useRef(true)
  const [showBack, setShowBack] = useState(false)
  const words = useMemo(() => turns.flatMap((t) => t.words), [turns])

  useEffect(() => {
    const audio = audioRef.current
    const spans = listRef.current!.querySelectorAll<HTMLElement>('[data-i]')
    if (!audio) return
    let active = -1, frame = 0
    const update = () => {
      const next = findWord(words, audio.currentTime * 1000)
      if (next === active) return
      spans[active]?.classList.remove('active')
      spans[next]?.classList.add('active')
      if (next >= 0 && following.current) spans[next].scrollIntoView({ block: 'nearest' })
      active = next
    }
    const tick = () => { update(); frame = requestAnimationFrame(tick) }
    const stop = () => { cancelAnimationFrame(frame); update() }
    const events = [['play', tick], ['pause', stop], ['seeked', update]] as const
    events.forEach(([name, fn]) => audio.addEventListener(name, fn))
    if (audio.paused) update(); else tick()
    return () => {
      cancelAnimationFrame(frame)
      events.forEach(([name, fn]) => audio.removeEventListener(name, fn))
    }
  }, [audioRef, words])

  const seek = (ms: number) => { if (audioRef.current) audioRef.current.currentTime = ms / 1000 }
  const stopFollowing = () => { following.current = false; setShowBack(true) }
  const resume = () => {
    following.current = true
    setShowBack(false)
    listRef.current?.querySelector('.active')?.scrollIntoView({ block: 'center' })
  }

  return (
    <section aria-label="Transcript">
      <div ref={listRef} className="transcript" tabIndex={0}
        onWheel={stopFollowing} onTouchMove={stopFollowing}
        onKeyDown={(e) => SCROLL_KEYS.includes(e.key) && stopFollowing()}
        onClick={(e) => {
          const ms = (e.target as HTMLElement).closest<HTMLElement>('[data-ms]')?.dataset.ms
          if (ms) seek(Number(ms))
        }}>
        <Lines turns={turns} />
      </div>
      {showBack && <button type="button" onClick={resume}>Back to playback</button>}
    </section>
  )
}

// Rendered once per call. Playback only toggles a class, so these never re-render.
const Lines = memo(function Lines({ turns }: { turns: Turn[] }) {
  let i = 0
  return turns.map((turn) => (
    <p key={turn.id} dir="auto">
      <button type="button" data-ms={turn.startMs}>{turn.speaker}</button>{' '}
      {turn.words.map((w) => <span key={i} data-i={i++} data-ms={w.startMs}>{w.w} </span>)}
    </p>
  ))
})
```

What changed and why, briefly:

- **Seconds, not milliseconds**, and all listeners are cleaned up.
- **No React render during playback.** `Lines` renders once, and a rAF loop toggles one class on two spans.
- **Binary search** instead of every word checking the time.
- **Follow-scroll stops when the user scrolls.** "Back to playback" returns to the playhead.
- **Keyboard-seekable turn buttons**, one delegated click handler, `dir="auto"` per turn, and a labelled region.

### (3) Helping them get more out of AI tools

This code isn't wrong because an AI wrote it. It's wrong because it was tested against the easy case, so next time I'd ask them to give the tool the hard constraints up front ("45 minutes, 15k words, 60fps, keyboard-only, Arabic RTL") and to write the test first, starting with the 45-minute call, before accepting any output. I'd also ask them to have the assistant review its own diff with "what breaks at 100× the data, and what leaks on unmount?" and to be able to explain every line in the PR before opening it. That's the same bar we'd hold hand-written code to.

## 2.3 The latency the user feels

If every server metric looks fine, we're measuring the wrong interval. Server dashboards start the clock when audio reaches us. The user's clock starts when they stop speaking and stops at the first syllable they hear.

**Where the client adds latency**

- **Endpointing.** Often the biggest cost. A VAD that waits for 800 ms of silence adds 800 ms before STT or the LLM starts. Semantic turn detection beats a fixed silence timeout.
- **Capture.** Echo cancellation and noise suppression add tens of milliseconds. Bluetooth headsets add 100–200 ms each way.
- **Network.** Under jitter or packet loss, the WebRTC jitter buffer grows by 50–200 ms. Networks that block UDP force a fallback to TURN over TCP, adding round-trip time and head-of-line blocking.
- **Playback.** A player that waits for full sentences instead of streaming TTS chunks, or an `AudioContext` suspended by autoplay policy, can add a second or more.
- **UI and dead air.** Silence feels longer than the same wait with a visible "listening → thinking" state. Tool calls are the worst case. I'd play a short waiting message ("let me check that for you") the moment a tool starts, and show the same state in the UI.

**How I'd measure end to end**

- **Perceived latency as the headline metric:** user stops speaking to bot starts speaking. Measure it on the client (last speech frame to first audio frame played), not from server timestamps.
- **Component-wise latency per turn:** VAD end, STT final, LLM TTFT, TTS TTFB, and first audio packet sent, received and played. A shared turn ID across LiveKit data messages and Pipecat metrics joins client and server events into one timeline.
- **Tool call delays tracked separately** (which tool, how often, p95 duration), since one slow API can dominate a turn.
- **WebRTC `getStats()` per call:** RTT, jitter, packet loss, `jitterBufferDelay`, and candidate type (relay or direct).
- **Recorded audio on both sides** for sampled calls, with the gap measured on the waveform. This is ground truth, and it catches device latency that instrumentation misses.
- **p50 and p95 for each segment**, sliced by browser, device, network and region. "Feels slow" usually lives in the p95.

That turns a vague complaint into a fixable one: "The server takes 700 ms, but endpointing adds 900 ms and a slow CRM tool adds 1.2 s, so tune VAD and add a waiting message there first."

## 2.4 React Flow, two years later

**What I'd do differently:** I'd design the data model before the canvas. We started from React Flow's examples, and most of what broke later came from that.

**Performance.** Past about 100 nodes, dragging one node re-rendered every node and edge. Custom nodes weren't memoised, and each read the whole flow from one context. Today I'd memoise custom nodes, give each node a store selector for only its own data (moving A never re-renders B), and use viewport-only rendering for big flows. I'd also profile first; we guessed for too long.

**State.** The saved flow JSON, UI state (selection, panels, drag) and server state (saved or not, validation) lived in one object. Autosave fired on selection changes, and a slow save could reset a node mid-drag. Today I'd use a normalised Zustand store with node _data_ separate from _layout_ (x, y), and server state in a query cache.

**Undo.** We snapshotted the whole flow on every change. That was simple until large flows held hundreds of copies and undo lagged. Today I'd record Immer patches: small forward/inverse pairs, and a whole drag becomes one entry, not sixty.

**What non-technical users struggled with.** I expected the canvas to be the hard part. It wasn't; people liked dragging boxes. The programming was hard. They didn't know what a variable was or where its value came from, what happens when no branch condition matches, or that they'd built a loop. So they built dead ends and forgot fallback edges. Those bots looked finished on the canvas and failed on a real conversation.

I'd add three things:

- validation warnings on the canvas (unreachable nodes, branches with no fallback, variables used before they're set)
- templates, so nobody starts from a blank canvas
- a test-run simulator that chats with the draft bot and lights up the path it takes

The simulator mattered most. Users understood their flow by watching it run, not by reading it.
