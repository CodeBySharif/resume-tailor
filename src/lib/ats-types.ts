export type AtsCategoryId =
  | "keyword_match"
  | "title_alignment"
  | "quantified_impact"
  | "section_structure"
  | "formatting"
  | "experience_depth"
  | "education_certs"
  | "action_verbs"
  | "repetition"
  | "spelling_grammar";

export type AtsCategoryStatus = "pass" | "warning" | "fail";

export interface AtsCategoryDefinition {
  id: AtsCategoryId;
  label: string;
  weight: number;
}

export const ATS_CATEGORY_DEFINITIONS: AtsCategoryDefinition[] = [
  { id: "keyword_match", label: "Keyword & Skills Match", weight: 20 },
  { id: "title_alignment", label: "Job Title Alignment", weight: 10 },
  { id: "quantified_impact", label: "Quantified Impact", weight: 15 },
  { id: "section_structure", label: "Section Structure", weight: 10 },
  { id: "formatting", label: "Formatting & Parseability", weight: 10 },
  { id: "experience_depth", label: "Experience Recency & Depth", weight: 10 },
  { id: "education_certs", label: "Education & Certifications", weight: 5 },
  { id: "action_verbs", label: "Action Verbs & Bullet Quality", weight: 10 },
  { id: "repetition", label: "Repetition & Variety", weight: 5 },
  { id: "spelling_grammar", label: "Spelling & Grammar", weight: 5 },
];

export interface AtsCategoryResult {
  id: AtsCategoryId;
  label: string;
  weight: number;
  score: number;
  status: AtsCategoryStatus;
  findings: string[];
  suggestions: string[];
}

export interface AtsCheckResult {
  overallScore: number;
  grade: string;
  categories: AtsCategoryResult[];
  missingKeywords: string[];
  matchedKeywords: string[];
  topPriorities: string[];
  checkedAt: string;
}

const VALID_IDS = new Set(ATS_CATEGORY_DEFINITIONS.map((c) => c.id));

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeStatus(value: unknown, score: number): AtsCategoryStatus {
  if (value === "pass" || value === "warning" || value === "fail") {
    return value;
  }
  if (score >= 75) return "pass";
  if (score >= 55) return "warning";
  return "fail";
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function scoreToGrade(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  return "Needs Work";
}

export function computeWeightedOverallScore(
  categories: AtsCategoryResult[]
): number {
  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = categories.reduce(
    (sum, c) => sum + c.score * c.weight,
    0
  );
  return Math.round(weighted / totalWeight);
}

export function normalizeAtsCheckResult(raw: unknown): AtsCheckResult {
  const data = (raw ?? {}) as Record<string, unknown>;
  const rawCategories = Array.isArray(data.categories) ? data.categories : [];

  const byId = new Map<AtsCategoryId, AtsCategoryResult>();

  for (const item of rawCategories) {
    const row = (item ?? {}) as Record<string, unknown>;
    const id = row.id as AtsCategoryId;
    if (!VALID_IDS.has(id)) continue;

    const def = ATS_CATEGORY_DEFINITIONS.find((c) => c.id === id)!;
    const score = clampScore(row.score);

    byId.set(id, {
      id,
      label: typeof row.label === "string" ? row.label : def.label,
      weight: def.weight,
      score,
      status: normalizeStatus(row.status, score),
      findings: normalizeStringArray(row.findings),
      suggestions: normalizeStringArray(row.suggestions),
    });
  }

  const categories: AtsCategoryResult[] = ATS_CATEGORY_DEFINITIONS.map(
    (def) =>
      byId.get(def.id) ?? {
        id: def.id,
        label: def.label,
        weight: def.weight,
        score: 0,
        status: "fail" as const,
        findings: ["No analysis returned for this category."],
        suggestions: [],
      }
  );

  const overallScore =
    typeof data.overallScore === "number"
      ? clampScore(data.overallScore)
      : computeWeightedOverallScore(categories);

  return {
    overallScore,
    grade:
      typeof data.grade === "string" && data.grade.trim()
        ? data.grade.trim()
        : scoreToGrade(overallScore),
    categories,
    missingKeywords: normalizeStringArray(data.missingKeywords),
    matchedKeywords: normalizeStringArray(data.matchedKeywords),
    topPriorities: normalizeStringArray(data.topPriorities).slice(0, 3),
    checkedAt:
      typeof data.checkedAt === "string" && data.checkedAt.trim()
        ? data.checkedAt
        : new Date().toISOString(),
  };
}

export const ATS_CHECK_JSON_SCHEMA = `{
  "overallScore": <number 0-100, weighted average of category scores>,
  "grade": "<Excellent|Good|Fair|Needs Work>",
  "categories": [
    {
      "id": "<keyword_match|title_alignment|quantified_impact|section_structure|formatting|experience_depth|education_certs|action_verbs|repetition|spelling_grammar>",
      "label": "<category label>",
      "weight": <number, use rubric weights>,
      "score": <number 0-100>,
      "status": "<pass|warning|fail>",
      "findings": ["<specific evidence from resume>"],
      "suggestions": ["<actionable fix>"]
    }
  ],
  "missingKeywords": ["<important JD terms absent from resume>"],
  "matchedKeywords": ["<important JD terms found in resume>"],
  "topPriorities": ["<top 3 highest-impact fixes, ordered>"],
  "checkedAt": "<ISO timestamp>"
}`;
