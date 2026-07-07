/**
 * Decode HTML entities and normalize Unicode punctuation for PDF-safe text.
 * LLMs often emit &#8209; (non-breaking hyphen), smart quotes, etc. which
 * render as "&" or missing glyphs in Helvetica via @react-pdf/renderer.
 */
export function decodeHtmlEntities(text: string): string {
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

  let result = text;
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

export function normalizePrintableText(text: string): string {
  if (!text) return "";

  let result = decodeHtmlEntities(text);

  result = result
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-")
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[\u00A0\u202F\u2007]/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");

  return result;
}
