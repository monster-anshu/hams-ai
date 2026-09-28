const ARABIC_LETTER = /[ء-يٱ-ۓ]/g;
const LATIN_LETTER = /[A-Za-z]/g;

export function toLatinDigits(text: string) {
  return text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

export function hasArabic(text: string) {
  return /[؀-ۿ]/.test(text);
}

// Language with the most letters, so screen readers pick the right voice for a turn.
export function dominantLang(text: string): "ar" | "en" {
  const arabic = text.match(ARABIC_LETTER)?.length ?? 0;
  const latin = text.match(LATIN_LETTER)?.length ?? 0;
  return arabic > latin ? "ar" : "en";
}
