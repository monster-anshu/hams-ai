import { STAGES, type Stage } from "@/lib/latency";

// Categorical slots 1–4 in fixed order, plus neutral grey for the unaccounted remainder.
export const STAGE_COLORS: Record<Stage, string> = {
  stt: "#2a78d6",
  llm: "#eb6834",
  tool: "#1baf7a",
  tts: "#eda100",
  other: "#a1a1aa",
};

// Width is `total / scaleMs`, so bars that share a scale compare at a glance.
export function StageBar({ stages, scaleMs }: { stages: Record<Stage, number>; scaleMs: number }) {
  const total = STAGES.reduce((sum, s) => sum + stages[s], 0);

  return (
    <div aria-hidden className="flex h-2 gap-[2px]" style={{ width: `${Math.min(100, (total / scaleMs) * 100)}%` }}>
      {STAGES.filter((s) => stages[s] > 0).map((s) => (
        <span
          key={s}
          className="h-full first:rounded-s last:rounded-e"
          style={{ flexGrow: stages[s], flexBasis: 0, minWidth: 2, background: STAGE_COLORS[s] }}
        />
      ))}
    </div>
  );
}
