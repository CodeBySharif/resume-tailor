/**
 * Decode HTML entities and normalize Unicode punctuation for PDF-safe text.
 * LLMs often emit &#8209; (non-breaking hyphen), smart quotes, etc. which
 * render as "&" or missing glyphs in Helvetica via @react-pdf/renderer.
 */

/** Coerce LLM/JSON values to a plain string before calling string methods. */
export function coerceToText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => coerceToText(item))
      .filter(Boolean)
      .join("\n");
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.content === "string") return obj.content;
    if (typeof obj.value === "string") return obj.value;
    if (typeof obj.str === "string") return obj.str;
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return String(value);
}

export function decodeHtmlEntities(text: unknown): string {
  const named: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "-",
    mdash: "-",
    hyphen: "-",
    hellip: "...",
  };

  let result = coerceToText(text);
  if (!result) return "";

  result = result.replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
    String.fromCodePoint(parseInt(hex, 16))
  );
  result = result.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCodePoint(Number(dec))
  );
  result = result.replace(/&([a-z]+);/gi, (match, name) => {
    const key = name.toLowerCase();
    return key in named ? named[key] : match;
  });
  return result;
}

export function normalizePrintableText(text: unknown): string {
  const raw = coerceToText(text);
  if (!raw) return "";

  let result = decodeHtmlEntities(raw);

  result = result
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-")
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[\u00A0\u202F\u2007]/g, " ")
    // Soft hyphens + zero-width chars cause mid-word PDF line breaks
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, "");

  return result;
}
