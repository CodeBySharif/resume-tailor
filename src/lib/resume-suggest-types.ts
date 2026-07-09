export interface ResumeSuggestSection {
  id: string;
  label: string;
  findings: string[];
  suggestions: string[];
}

export interface ResumeSuggestResult {
  priorities: string[];
  sections: ResumeSuggestSection[];
  checkedAt: string;
}

export const RESUME_SUGGEST_JSON_SCHEMA = `{
  "priorities": ["<top 3 highest-impact improvements, ordered>"],
  "sections": [
    {
      "id": "<section id e.g. summary|experience|skills|education|formatting>",
      "label": "<section label>",
      "findings": ["<specific gap or issue>"],
      "suggestions": ["<actionable fix>"]
    }
  ],
  "checkedAt": "<ISO timestamp>"
}`;

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function normalizeResumeSuggestResult(
  raw: unknown
): ResumeSuggestResult {
  const data = raw as Record<string, unknown>;
  const sections = Array.isArray(data.sections)
    ? data.sections.map((s, i) => {
        const sec = s as Record<string, unknown>;
        return {
          id: typeof sec.id === "string" ? sec.id : `section-${i}`,
          label: typeof sec.label === "string" ? sec.label : "Section",
          findings: normalizeStringArray(sec.findings),
          suggestions: normalizeStringArray(sec.suggestions),
        };
      })
    : [];

  return {
    priorities: normalizeStringArray(data.priorities).slice(0, 5),
    sections,
    checkedAt:
      typeof data.checkedAt === "string"
        ? data.checkedAt
        : new Date().toISOString(),
  };
}
