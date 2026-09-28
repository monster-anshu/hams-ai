"use client";

import { useLocale } from "@/hooks/useLocale";

export function LanguageToggle() {
  const { locale, m, setLocale } = useLocale();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      lang={next}
      onClick={() => setLocale(next)}
      className="rounded-md border border-zinc-500/30 px-3 py-1 text-sm hover:bg-zinc-500/10"
    >
      {m.switchLanguage}
    </button>
  );
}
