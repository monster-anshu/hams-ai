// Generates a ~45-minute, ~1,200-turn call: audio via macOS `say`, plus transcript,
// latency report and tool data in the same shapes as the real sample call.
// Usage: pnpm gen:long   (macOS only; outputs are committed so nobody else needs to run it)
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const RATE = 22050;
const TARGET_S = 45 * 60;
const BAD_MOMENT_S = 31 * 60 + 20;
const BASE = Date.parse("2026-09-28T10:00:00.000Z");
const CACHE = join(tmpdir(), "hams-say-cache");

const VOICES = { agent: ["Samantha", 225], en: ["Tara", 215], ar: ["Majed", 200] };

// [customer line, customer voice, agent reply, tool?]
const EXCHANGES = [
  ["I want to book a flight.", "en", "Sure. Where would you like to fly?"],
  ["From Delhi to Dubai.", "en", "Got it. What date works for you?"],
  ["Next Friday, please.", "en", "I have two options that day."],
  ["Is there a morning flight?", "en", "Yes, one leaves at nine a.m."],
  ["What is the fare?", "en", "Economy starts at four hundred dollars.", "get_fare"],
  ["Can I add extra baggage?", "en", "Yes, twenty kilos is fifty dollars."],
  ["Two passengers.", "en", "Two passengers, noted."],
  ["Economy is fine.", "en", "Economy it is."],
  ["Can I choose a window seat?", "en", "Window seat fourteen A is free.", "get_seat_map"],
  ["Yes, please.", "en", "Done. Anything else?"],
  ["Can you repeat that?", "en", "Of course. Seat fourteen A, window."],
  ["What time does it land?", "en", "It lands at eleven thirty local time."],
  ["Is a meal included?", "en", "Yes, a hot meal is included."],
  ["أبي أحجز رحلة للرياض", "ar", "Sure, flying to Riyadh. Which date?"],
  ["كم سعر التذكرة؟", "ar", "The ticket is three hundred dollars.", "get_fare"],
  ["وش أسعار الدرجة الأولى؟", "ar", "First class is nine hundred dollars.", "get_fare"],
  ["Can you check if there's a seat على الدرجة الأولى?", "ar", "Let me check first class for you.", "get_seat_map"],
  ["الاسعار عالية شوي", "ar", "I understand. Economy is cheaper."],
  ["ابي اغير الرحلة لبكرة الساعة ٩ الصبح", "ar", "Moving you to tomorrow at nine a.m.", "change_booking"],
];
const BAD = ["أبي أغير رحلتي من الرياض لجدة، الحجز رقم 2Q7HX", "ar", "Sorry, I'm having trouble with that. Let me transfer you.", "change_booking"];
const GREETING = "Hello, I am Hema from Saudi airline. How can I help?";
const HANDOVER = "Hi, this is Omar from bookings. How can I help?";

// Seeded so every run produces the same call.
let seed = 42;
const random = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = (min, max) => Math.round(min + random() * (max - min));
const pick = (items) => items[Math.floor(random() * items.length)];
const hex = () => Array.from({ length: 16 }, () => Math.floor(random() * 16).toString(16)).join("");

function speak(text, voiceKey) {
  const [voice, rate] = VOICES[voiceKey];
  const file = join(CACHE, createHash("sha1").update(`${voice}${rate}${text}`).digest("hex") + ".wav");
  if (!existsSync(file)) execFileSync("say", ["-v", voice, "-r", String(rate), "-o", file, `--data-format=LEI16@${RATE}`, text]);
  return trimSilence(readPcm(file));
}

function readPcm(file) {
  const buf = readFileSync(file);
  let offset = 12;
  while (offset < buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "data") return new Int16Array(buf.buffer.slice(buf.byteOffset + offset + 8, buf.byteOffset + offset + 8 + size));
    offset += 8 + size + (size % 2);
  }
  throw new Error(`no data chunk in ${file}`);
}

// `say` pads clips with silence; trimming it keeps turn boundaries on the actual speech.
function trimSilence(pcm) {
  const loud = (s) => Math.abs(s) > 300;
  const start = pcm.findIndex(loud);
  const end = pcm.findLastIndex(loud);
  return pcm.subarray(start, end + 1);
}

function agentLatency(tool, bad) {
  const stt = random() < 0.03 ? between(900, 1300) : between(300, 420);
  const llm = random() < 0.02 ? between(1000, 1500) : between(38, 100);
  const tts = between(90, 135);
  const network = between(20, 120);
  let toolCall;
  if (bad) toolCall = { name: tool, status: "timeout", duration_ms: 5500 };
  else if (tool) toolCall = { name: tool, status: random() < 0.08 ? "error" : "ok", duration_ms: between(120, 380) };
  return { stt, llm, tts, network, tool: toolCall };
}

mkdirSync(CACHE, { recursive: true });
const clips = [];
const turns = [];
const report = [];
const tools = [];
let cursor = 0;

function place(speaker, text, voiceKey) {
  const pcm = speak(text, voiceKey);
  const start = cursor;
  clips.push({ pcm, at: Math.round((start / 1000) * RATE) });
  cursor += Math.round((pcm.length / RATE) * 1000);
  turns.push({
    sequence_no: turns.length + 1,
    speaker,
    transcript: text,
    start_time: new Date(BASE + start).toISOString(),
    end_time: new Date(BASE + cursor).toISOString(),
  });
}

function exchange([customerText, voiceKey, agentText, tool], bad = false) {
  cursor += between(350, 800);
  place("user", customerText, voiceKey);
  const userStops = cursor;
  const l = agentLatency(tool, bad);
  cursor += l.stt + l.llm + (l.tool?.duration_ms ?? 0) + l.tts + l.network;
  const turnId = hex();
  report.push({
    turn_id: turnId,
    sequence: report.length + 1,
    ub_latency_ms: cursor - userStops,
    network_latency_ms: l.network + (l.tool?.duration_ms ?? 0),
    user_stops_speaking: new Date(BASE + userStops).toISOString(),
    bot_starts_speaking: new Date(BASE + cursor).toISOString(),
    total_latency_ms_per_turn: l.stt + l.llm + l.tts,
    last_stt_ms: l.stt,
    first_tts_ms: l.tts,
    last_llm_ms: l.llm,
    tool_llm_ms: null,
  });
  if (l.tool) tools.push({ turn_id: turnId, ...l.tool });
  place("agent", agentText, "agent");
}

place("agent", GREETING, "agent");
let badDone = false;
while (cursor < TARGET_S * 1000 - 8000) {
  if (!badDone && cursor >= BAD_MOMENT_S * 1000) {
    exchange(BAD, true);
    cursor += 3000;
    place("agent", HANDOVER, "agent");
    badDone = true;
  } else {
    exchange(pick(EXCHANGES));
  }
}

const totalSamples = TARGET_S * RATE;
const pcm = new Int16Array(totalSamples);
for (const clip of clips) pcm.set(clip.pcm.subarray(0, totalSamples - clip.at), clip.at);

mkdirSync("data/long", { recursive: true });
mkdirSync("public/calls", { recursive: true });
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "s16le", "-ar", String(RATE), "-ac", "1", "-i", "pipe:0", "-c:a", "aac", "-b:a", "32k", "public/calls/long.m4a"], {
  input: Buffer.from(pcm.buffer),
  maxBuffer: 1024 * 1024 * 1024,
});

const callId = "01a0e894-long-45min-generated000001";
const json = (value) => JSON.stringify(value, null, 4) + "\n";
writeFileSync("data/long/transcript.json", json({ success: true, response: { call_id: callId, turns }, message: "Generated by scripts/generate-long-call.mjs" }));
writeFileSync("data/long/latency.json", json({ success: true, response: { call_id: callId, turn_count: report.length, turns: report } }));
writeFileSync("data/long/tools.json", json({ note: "Generated. Tool time is included in network_latency_ms, as the platform reports it.", tools }));

const slow = report.filter((r) => r.ub_latency_ms >= 1000).length;
console.log(`${turns.length} turns, ${(cursor / 60000).toFixed(1)} min of speech timeline, ${report.length} replies (${slow} slow), ${tools.length} tool calls`);
