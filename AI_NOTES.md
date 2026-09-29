# AI notes

## Tools

Claude Code (Claude Opus) in the terminal, for the whole assessment.

## Where it helped

- **Formatting and grammar.** It formatted my answers and the READMEs, and checked my English for grammar mistakes.
- **Turning raw thoughts into structured points.** I wrote my thinking down roughly, and it turned that into clear, detailed points.
- **Arabic.** I don't speak Arabic. Claude wrote the Arabic UI strings and the Arabic lines in the generated call. A native speaker should review the strings before this ships.
- **Arabic-aware search.** I used Claude for the Arabic normalisation (hamza forms, taa marbuta, alef maqsura, diacritics, Arabic-Indic digits) and for searching Arabic text, so "اسعار" finds "أسعار" and "الأسعار".
- **The 45-minute load-test call.** It wrote the generator script (`pnpm gen:long`): macOS `say` voices, samples placed at exact offsets, and ffmpeg encoding, with the 6-second silence hidden at 31:28.
- **Checking my work against the brief.** I asked it to compare what I'd built with each must-have and deliverable, and it pointed out gaps.
- **Thinking out loud.** I talked through my doubts with it, for example turn gaps versus platform latency, whether to virtualise, and library versus own normalisation. The final decisions and their reasons are in the README decision log.
- **Verification.** It drove headless Chrome to check each feature (sync, share links, shortcuts, the Arabic UI, search).

## Where I overrode it

- **Simplicity.** It tends to add abstraction and comments. I kept asking for simpler code and smaller components.
- **Real data over dummy data.** We started with dummy latency data in the transcript. I replaced it with the real platform export (`data/latency.json`) and had it rebuild the latency view on that, with dummy data only for tool calls.

## One thing it got confidently wrong

Latency. Early on it measured latency from the gaps between turns in the transcript and told me the agent answered in about 150ms. When the real platform data arrived, the average was about 700ms. It first "corrected" its explanation wrongly. Then it found the real cause: the transcript's `end_time` lags the platform's `user_stops_speaking` by about 400ms. Even then, the "~150ms, 4× undercount" stayed in the README until I asked it to fill in the decision log and it re-ran the numbers: 268ms against 701ms, about 2.5×. It sounded equally sure every time. Now I don't accept a number from it until it has re-run the calculation on the data. That change of method is in the decision log.
