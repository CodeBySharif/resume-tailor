import { normalizePrintableText } from "./text-normalize";
import type { Resume } from "./resume-schema";

function splitListTokens(value: string): string[] {
  return value
    .split(/[,;|•·]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

const TECH_PATTERN =
  /\.net|\.net core|mvc|api|sql|react|angular|vue|node\.?js|python|java|c#|aws|azure|docker|kubernetes|typescript|javascript|postgres|mysql|mongodb|redis|graphql|rest|blazor|entity framework|ef core/i;

const SENTENCE_VERB_PATTERN =
  /\b(developed|designed|built|implemented|created|led|managed|reduced|improved|automated|accelerat|delivered|architected|integrated|established|streamlined|optimized|workflows?|integration|system with|application|reporting|compliance|qualification)\b/i;

export function containsLlmJsonArtifact(text: string): boolean {
  return /\?\?\?|Wait we need|Let'?s correct|Actually we need|\}\]\}/i.test(
    text
  );
}

/** Strip model self-correction / truncated JSON debris from parsed resume text. */
export function sanitizeParsedResumeText(text: string): string {
  if (!text) return "";

  let result = normalizePrintableText(text);
  result = result.split(/\?\?\?+/)[0] ?? "";
  result = result.replace(/\bWait we need\b[\s\S]*/i, "");
  result = result.replace(/\bLet'?s correct\b[\s\S]*/i, "");
  result = result.replace(/\bActually we need\b[\s\S]*/i, "");
  result = result.replace(/[\]}]+\s*$/g, "");
  return normalizePrintableText(result.trim());
}

function sentenceLike(text: string): boolean {
  const t = sanitizeParsedResumeText(text);
  if (!t) return false;
  if (SENTENCE_VERB_PATTERN.test(t)) return true;
  return t.length > 55 && /\.\s/.test(t);
}

function looksLikeProjectTitle(text: string): boolean {
  const t = sanitizeParsedResumeText(text);
  if (!t || t.length > 45) return false;
  if (sentenceLike(t) || isTechnologyOnlyLine(t)) return false;
  return /^[A-Z0-9][\w\s.&/-]*$/.test(t);
}

export function isTechnologyOnlyLine(text: string): boolean {
  const t = sanitizeParsedResumeText(text);
  if (!t || t.length > 100) return false;
  if (containsLlmJsonArtifact(t) || sentenceLike(t)) return false;
  if (TECH_PATTERN.test(t)) return true;
  if (t.startsWith(".")) return true;
  if (/,/.test(t) && t.length < 80) return true;
  return false;
}

function addUniqueTech(tech: string[], raw: string) {
  for (const item of splitListTokens(raw)) {
    const value = sanitizeParsedResumeText(item);
    if (!value || containsLlmJsonArtifact(value) || sentenceLike(value)) continue;
    if (!tech.some((existing) => existing.toLowerCase() === value.toLowerCase())) {
      tech.push(value);
    }
  }
}

export function partitionProjectBulletsAndTechnologies(
  bullets: string[],
  technologies: string[]
): { bullets: string[]; technologies: string[] } {
  const outBullets: string[] = [];
  const tech = technologies
    .map((item) => sanitizeParsedResumeText(item))
    .filter((item) => item && !containsLlmJsonArtifact(item));

  for (const raw of bullets) {
    const cleaned = sanitizeParsedResumeText(raw);
    if (!cleaned || containsLlmJsonArtifact(cleaned)) continue;

    const segments = cleaned
      .split(/\n+/)
      .map((line) => sanitizeParsedResumeText(line))
      .filter(Boolean);

    const lines = segments.length > 0 ? segments : [cleaned];

    for (let i = 0; i < lines.length; i++) {
      const segment = lines[i];
      const next = lines[i + 1];

      if (looksLikeProjectTitle(segment) && next && sentenceLike(next)) {
        continue;
      }

      if (isTechnologyOnlyLine(segment)) {
        addUniqueTech(tech, segment);
        continue;
      }

      if (!sentenceLike(segment) && segment.length < 25) {
        continue;
      }

      outBullets.push(segment);
    }
  }

  return { bullets: outBullets, technologies: tech };
}

export function resumeHasParseArtifacts(resume: Resume): boolean {
  const fields: string[] = [
    resume.summary,
    ...resume.projects.flatMap((p) => [
      p.name,
      p.description,
      ...p.bullets,
      ...(p.technologies ?? []),
    ]),
    ...resume.skills,
    ...resume.languages,
  ];
  return fields.some((value) => containsLlmJsonArtifact(value));
}

export function extractJsonObject(text: string): unknown {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Model returned invalid JSON");
  }
}
