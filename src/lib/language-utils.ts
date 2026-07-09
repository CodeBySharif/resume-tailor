export const LANGUAGE_PROFICIENCY_OPTIONS = [
  "Native",
  "Fluent",
  "Professional working",
  "Conversational",
  "Basic",
  "Elementary",
] as const;

export type LanguageProficiency = (typeof LANGUAGE_PROFICIENCY_OPTIONS)[number];

export function formatLanguageEntry(
  language: string,
  proficiency: string
): string {
  const name = language.trim();
  const level = proficiency.trim();
  if (!name) return "";
  if (!level) return name;
  return `${name} (${level})`;
}

export function parseLanguageEntry(entry: string): {
  language: string;
  proficiency: string;
} {
  const trimmed = entry.trim();
  const match = trimmed.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return { language: match[1].trim(), proficiency: match[2].trim() };
  }
  return { language: trimmed, proficiency: "" };
}
