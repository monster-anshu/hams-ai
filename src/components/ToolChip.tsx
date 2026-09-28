import type { ToolStatus } from "@/lib/latency";

const STATUS = {
  ok: { icon: "✓", label: "success", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  error: { icon: "✕", label: "failed", className: "border-red-200 bg-red-50 text-red-800" },
  timeout: { icon: "⏱", label: "timed out", className: "border-red-200 bg-red-50 text-red-800" },
} satisfies Record<ToolStatus, { icon: string; label: string; className: string }>;

export function ToolChip({ name, status }: { name: string; status: ToolStatus }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 text-xs ${s.className}`}>
      <WrenchIcon />
      <span className="font-mono">{name}</span>
      <span aria-hidden>{s.icon}</span>
      <span>{s.label}</span>
    </span>
  );
}

function WrenchIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
