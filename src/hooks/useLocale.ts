import { useSyncExternalStore } from "react";
import { MESSAGES, type Locale } from "@/lib/i18n";

const KEY = "hams:locale";
const EVENT = "hams:locale-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

const read = (): Locale => (localStorage.getItem(KEY) === "ar" ? "ar" : "en");

// Server render is always English; the saved choice applies right after hydration.
export function useLocale() {
  const locale = useSyncExternalStore(subscribe, read, () => "en" as const);

  const setLocale = (next: Locale) => {
    localStorage.setItem(KEY, next);
    window.dispatchEvent(new Event(EVENT));
  };

  return { locale, m: MESSAGES[locale], setLocale };
}
