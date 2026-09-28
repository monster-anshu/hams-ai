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

// Folds the spellings Arabic readers treat as the same word, so search can compare them.
// NFD splits "أ" into "ا" + a combining hamza, so stripping combining marks (\p{Mn})
// removes every diacritic and every hamza-on-a-letter in one step.
export function normalizeArabic(text: string) {
  return toLatinDigits(text)
    .normalize("NFKC")
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .replace(/ٱ/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ـ/g, "")
    .toLowerCase();
}
