"use client";

import { useEffect } from "react";
import { useLocale } from "@/hooks/useLocale";

// Keeps <html lang dir> in step with the chosen UI language.
export function LocaleSync() {
  const { locale } = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  return null;
}
