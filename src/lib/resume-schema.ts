import {
  partitionProjectBulletsAndTechnologies,
  sanitizeParsedResumeText,
} from "./resume-parse-sanitize";
import { dedupeExperienceLocation } from "./experience-format";
import { parseToMonthYear } from "./date-utils";
import {
  normalizeHeaderNameTitle,
} from "./format-name";
import { normalizePrintableText } from "./text-normalize";

export interface ResumeHeader {
  name: string;
  title: string;
  phone: string;
  email: string;
  city: string;
  linkedin?: string;
  portfolio?: string;
  showLinkedin?: boolean;
  showPortfolio?: boolean;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string;
  bullets: string[];
}

export interface Project {
  id: string;
  name: string;
  /** @deprecated Synced from bullets — use bullets for editing */
  description: string;
  bullets: string[];
  technologies?: string[];
  url?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
}

/** Named skill group — defaults: Frontend, Backend, Database, Deployment, Tools, Other. */
export interface SkillCategory {
  id: string;
  name: string;
  skills: string[];
}

export const DEFAULT_SKILL_CATEGORY_NAMES = [
  "Frontend",
  "Backend",
  "Database",
  "Deployment",
  "Tools",
  "Other",
] as const;

export type DefaultSkillCategoryName =
  (typeof DEFAULT_SKILL_CATEGORY_NAMES)[number];

export interface Resume {
  header: ResumeHeader;
  summary: string;
  experience: Experience[];
  projects: Project[];
  education: Education[];
  skills: SkillCategory[];
  languages: string[];
  customSections: CustomSection[];
}

export interface JobDetails {
  company: string;
  role: string;
  jobDescription: string;
  /** Comma-separated skills/topics to never add or mention (e.g. "DevOps, Kubernetes") */
  skillsToExclude: string;
  /** What excites the candidate about this role/company (optional, for cover letter) */
  whatExcitesYou: string;
  /** Requirements the candidate lacks — address honestly in cover letter (optional) */
  skillGaps: string;
}

export type LLMProvider = "gemini" | "groq" | "openrouter";

export interface LLMSettings {
  provider: LLMProvider;
  geminiApiKey: string;
  groqApiKey: string;
  openrouterApiKey: string;
  openrouterModel: string;
}

export interface ResumeChange {
  section: string;
  field: string;
  before: string;
  after: string;
}

export interface TailorResult {
  resume: Resume;
  coverLetter: string;
  changes: ResumeChange[];
}

export const DEFAULT_LLM_SETTINGS: LLMSettings = {
  provider: "openrouter",
  geminiApiKey: "",
  groqApiKey: "",
  openrouterApiKey: "",
  openrouterModel: "openrouter/free",
};

export const LLM_SETTINGS_KEY = "resume-tailor-llm-settings";

export function createId(): string {
  return crypto.randomUUID();
}

export function createDefaultSkillCategories(): SkillCategory[] {
  return DEFAULT_SKILL_CATEGORY_NAMES.map((name) => ({
    id: createId(),
    name,
    skills: [],
  }));
}

/** Flat list of every skill across categories (for ATS counts, searches). */
export function flattenSkills(categories: SkillCategory[]): string[] {
  return categories.flatMap((c) =>
    c.skills.map((s) => normalizePrintableText(s)).filter(Boolean)
  );
}

export function hasAnySkills(categories: SkillCategory[]): boolean {
  return categories.some((c) => c.skills.some((s) => s.trim()));
}

/** Resume/PDF display — category label + comma-separated skills for indented layout. */
export function formatSkillCategoriesForDisplay(
  categories: SkillCategory[]
): { name: string; skillsLine: string }[] {
  return categories
    .map((c) => {
      const skills = c.skills
        .map((s) => normalizePrintableText(s))
        .filter(Boolean);
      if (!skills.length || !c.name.trim()) return null;
      return {
        name: c.name.trim(),
        skillsLine: skills.join(", "),
      };
    })
    .filter((row): row is { name: string; skillsLine: string } => Boolean(row));
}

/** @deprecated Prefer formatSkillCategoriesForDisplay for indented layout */
export function formatSkillCategoryLines(
  categories: SkillCategory[]
): string[] {
  return formatSkillCategoriesForDisplay(categories).map(
    (row) => `${row.name}: ${row.skillsLine}`
  );
}

/** Degree line: "Bachelor of Computer Science (Information Technology)" */
export function formatEducationCredential(
  degree: string,
  field?: string | null
): string {
  const level = normalizePrintableText(degree);
  const study = normalizePrintableText(field ?? "");
  if (!level && !study) return "";
  if (!study) return level;
  if (!level) return study;
  // Avoid "Degree (Degree)" if field already embedded
  if (level.toLowerCase().includes(study.toLowerCase())) return level;
  return `${level} (${study})`;
}

function matchDefaultCategoryName(name: string): string | null {
  const key = name.trim().toLowerCase();
  const found = DEFAULT_SKILL_CATEGORY_NAMES.find(
    (n) => n.toLowerCase() === key
  );
  return found ?? null;
}

/**
 * Accepts legacy flat string[] (→ Other) or categorized objects from the LLM.
 * Always returns the default categories first, then any custom ones.
 */
export function normalizeSkillCategories(raw: unknown): SkillCategory[] {
  const defaults = createDefaultSkillCategories();

  if (raw == null) return defaults;

  if (Array.isArray(raw)) {
    // Detect categorized objects: { name, skills } or { category, items }
    const categorized = raw.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item) &&
        (("skills" in item && Array.isArray((item as SkillCategory).skills)) ||
          ("items" in item && Array.isArray((item as { items: unknown }).items)))
    ) as Array<Record<string, unknown>>;

    // Legacy / uncategorized: ["React", "Node"] → Other
    if (categorized.length === 0) {
      const skills = coerceResumeStringList(raw);
      return defaults.map((cat) =>
        cat.name === "Other" ? { ...cat, skills } : cat
      );
    }

    const byDefault = new Map<
      string,
      { id?: string; skills: string[] }
    >(DEFAULT_SKILL_CATEGORY_NAMES.map((n) => [n, { skills: [] }]));
    const custom: SkillCategory[] = [];

    for (const entry of categorized) {
      const rawName = coerceResumeString(
        entry.name ?? entry.category ?? entry.title ?? ""
      );
      const skillList = coerceResumeStringList(
        entry.skills ?? entry.items ?? entry.values ?? []
      );
      const entryId =
        typeof entry.id === "string" && entry.id ? entry.id : undefined;
      if (!skillList.length && !rawName) continue;

      const defaultName = matchDefaultCategoryName(rawName);
      if (defaultName) {
        const prev = byDefault.get(defaultName) ?? { skills: [] };
        byDefault.set(defaultName, {
          id: prev.id ?? entryId,
          skills: [...prev.skills, ...skillList],
        });
      } else if (rawName) {
        custom.push({
          id: entryId ?? createId(),
          name: rawName,
          skills: skillList,
        });
      } else {
        const prev = byDefault.get("Other") ?? { skills: [] };
        byDefault.set("Other", {
          id: prev.id ?? entryId,
          skills: [...prev.skills, ...skillList],
        });
      }
    }

    const leftover = coerceResumeStringList(
      raw.filter((item) => typeof item === "string")
    );
    if (leftover.length) {
      const prev = byDefault.get("Other") ?? { skills: [] };
      byDefault.set("Other", {
        id: prev.id,
        skills: [...prev.skills, ...leftover],
      });
    }

    const mergedDefaults = DEFAULT_SKILL_CATEGORY_NAMES.map((name) => {
      const bucket = byDefault.get(name) ?? { skills: [] };
      return {
        id: bucket.id ?? createId(),
        name,
        skills: [...new Set(bucket.skills)],
      };
    });

    return [...mergedDefaults, ...custom];
  }

  // Single object map: { Frontend: [...], Backend: [...] }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    const byDefault = new Map<string, string[]>(
      DEFAULT_SKILL_CATEGORY_NAMES.map((n) => [n, []])
    );
    const custom: SkillCategory[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const skillList = coerceResumeStringList(value);
      if (!skillList.length) continue;
      const defaultName = matchDefaultCategoryName(key);
      if (defaultName) {
        byDefault.set(defaultName, [
          ...(byDefault.get(defaultName) ?? []),
          ...skillList,
        ]);
      } else {
        custom.push({ id: createId(), name: key, skills: skillList });
      }
    }

    return [
      ...DEFAULT_SKILL_CATEGORY_NAMES.map((name) => ({
        id: createId(),
        name,
        skills: [...new Set(byDefault.get(name) ?? [])],
      })),
      ...custom,
    ];
  }

  // Plain comma-separated string
  if (typeof raw === "string") {
    const skills = coerceResumeStringList(raw);
    return defaults.map((cat) =>
      cat.name === "Other" ? { ...cat, skills } : cat
    );
  }

  return defaults;
}

export function createEmptyResume(): Resume {
  return {
    header: {
      name: "",
      title: "",
      phone: "",
      email: "",
      city: "",
      linkedin: "",
      portfolio: "",
      showLinkedin: false,
      showPortfolio: false,
    },
    summary: "",
    experience: [],
    projects: [],
    education: [],
    skills: createDefaultSkillCategories(),
    languages: [],
    customSections: [],
  };
}

/** ATS-friendly scaffold for Create Resume flow — structured sections, one empty experience row. */
export function createAtsScaffoldResume(): Resume {
  return {
    header: {
      name: "",
      title: "",
      phone: "",
      email: "",
      city: "",
      linkedin: "",
      portfolio: "",
      showLinkedin: false,
      showPortfolio: false,
    },
    summary: "",
    experience: [
      {
        id: createId(),
        company: "",
        role: "",
        location: "",
        startDate: "",
        endDate: "",
        bullets: [""],
      },
    ],
    projects: [],
    education: [
      {
        id: createId(),
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        gpa: "",
      },
    ],
    skills: createDefaultSkillCategories(),
    languages: [],
    customSections: [],
  };
}

export function createTemplateResume(): Resume {
  return {
    header: {
      name: "Jane Doe",
      title: "Software Engineer",
      phone: "(555) 123-4567",
      email: "jane.doe@email.com",
      city: "San Francisco, CA",
      linkedin: "linkedin.com/in/janedoe",
      portfolio: "janedoe.dev",
    },
    summary:
      "Results-driven software engineer with 5+ years of experience building scalable web applications. Passionate about clean code, user experience, and delivering measurable business impact.",
    experience: [
      {
        id: createId(),
        company: "Tech Corp",
        role: "Senior Software Engineer",
        location: "San Francisco, CA",
        startDate: "2021",
        endDate: "Present",
        bullets: [
          "Led development of a microservices platform serving 2M+ daily active users",
          "Reduced API response times by 40% through caching and query optimization",
          "Mentored 3 junior engineers and established code review best practices",
        ],
      },
      {
        id: createId(),
        company: "Startup Inc",
        role: "Software Engineer",
        location: "Remote",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Built React/Node.js features used by 500K+ users",
          "Implemented CI/CD pipeline reducing deployment time by 60%",
        ],
      },
    ],
    projects: [
      {
        id: createId(),
        name: "Open Source CLI Tool",
        bullets: [
          "Developed a developer productivity CLI with 1K+ GitHub stars",
        ],
        description:
          "Developed a developer productivity CLI with 1K+ GitHub stars",
        technologies: ["TypeScript", "Node.js"],
        url: "github.com/janedoe/cli-tool",
      },
    ],
    education: [
      {
        id: createId(),
        institution: "State University",
        degree: "B.S.",
        field: "Computer Science",
        startDate: "2015",
        endDate: "2019",
        gpa: "3.8",
      },
    ],
    skills: [
      {
        id: createId(),
        name: "Frontend",
        skills: ["JavaScript", "TypeScript", "React"],
      },
      {
        id: createId(),
        name: "Backend",
        skills: ["Node.js", "Python"],
      },
      {
        id: createId(),
        name: "Database",
        skills: ["PostgreSQL"],
      },
      {
        id: createId(),
        name: "Deployment",
        skills: ["AWS", "Docker"],
      },
      {
        id: createId(),
        name: "Tools",
        skills: [],
      },
      {
        id: createId(),
        name: "Other",
        skills: [],
      },
    ],
    languages: ["English (Native)", "Spanish (Conversational)"],
    customSections: [],
  };
}

export function createEmptyJobDetails(): JobDetails {
  return {
    company: "",
    role: "",
    jobDescription: "",
    skillsToExclude: "",
    whatExcitesYou: "",
    skillGaps: "",
  };
}

export const RESUME_JSON_SCHEMA = `{
  "header": { "name": "string", "title": "string", "phone": "string", "email": "string", "city": "string", "linkedin": "string?", "portfolio": "string?" },
  "summary": "string",
  "experience": [{ "id": "string", "company": "string", "role": "string", "location": "string?", "startDate": "string", "endDate": "string", "bullets": ["string"] }],
  "projects": [{ "id": "string", "name": "string", "bullets": ["string"], "technologies": ["string"]?, "url": "string?" }],
  "education": [{ "id": "string", "institution": "string", "degree": "string", "field": "string?", "startDate": "string", "endDate": "string", "gpa": "string?" }],
  "skills": [{ "id": "string", "name": "Frontend|Backend|Database|Deployment|Tools|Other|<custom>", "skills": ["string"] }],
  "languages": ["string"],
  "customSections": [{ "id": "string", "title": "string", "content": "string" }]
}`;

export function coerceResumeString(value: unknown): string {
  if (typeof value === "string") return normalizePrintableText(value.trim());
  if (value == null) return "";
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const language = obj.language ?? obj.name ?? obj.lang;
    const level = obj.level ?? obj.proficiency ?? obj.fluency;
    if (typeof language === "string") {
      const label = level ? `${language} (${String(level)})` : language;
      return normalizePrintableText(label);
    }
    const parts = Object.values(obj).filter(
      (v) => typeof v === "string"
    ) as string[];
    return normalizePrintableText(parts.join(" ").trim());
  }
  return normalizePrintableText(String(value).trim());
}

export function splitResumeListTokens(value: string): string[] {
  return value
    .split(/[,;|•·]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function coerceResumeStringList(values: unknown): string[] {
  if (typeof values === "string") {
    return splitResumeListTokens(values).map(coerceResumeString).filter(Boolean);
  }
  if (!Array.isArray(values)) return [];
  return values
    .flatMap((item) => {
      const text = coerceResumeString(item);
      if (!text) return [];
      if (/[,;|•·]/.test(text)) return splitResumeListTokens(text);
      return [text];
    })
    .filter(Boolean);
}

export function projectDescriptionFromBullets(bullets: string[]): string {
  return bullets
    .map((bullet) => normalizePrintableText(bullet))
    .filter(Boolean)
    .join("\n");
}

export function getProjectBullets(
  project: Pick<Project, "bullets" | "description">
): string[] {
  const fromBullets = (project.bullets ?? [])
    .map((bullet) => normalizePrintableText(bullet))
    .filter(Boolean);
  if (fromBullets.length > 0) return fromBullets;

  const description = normalizePrintableText(project.description ?? "");
  if (!description) return [];

  const lines = description
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : [description];
}

/** Single bullet listing all project technologies (not one bullet per tech). */
export function formatProjectTechBullet(
  technologies: string[] | undefined | null
): string | null {
  const techs = (technologies ?? [])
    .map((t) => normalizePrintableText(t))
    .filter(Boolean);
  if (techs.length === 0) return null;
  if (techs.length === 1) return `Technologies: ${techs[0]}`;
  if (techs.length === 2) return `Technologies: ${techs[0]} and ${techs[1]}`;
  return `Technologies: ${techs.slice(0, -1).join(", ")}, and ${techs[techs.length - 1]}`;
}

function normalizeProjectBullets(
  project: Partial<Project>,
  sanitizeArtifacts: boolean
): string[] {
  const clean = (text: string) =>
    sanitizeArtifacts ? sanitizeParsedResumeText(text) : normalizePrintableText(text);

  const fromBullets = (project.bullets ?? [])
    .map((bullet) => clean(String(bullet)))
    .filter(Boolean);
  if (fromBullets.length > 0) return fromBullets;
  return getProjectBullets({
    bullets: [],
    description: clean(project.description ?? ""),
  });
}

export function normalizeResume(
  data: Partial<Resume>,
  options?: { sanitizeArtifacts?: boolean }
): Resume {
  const sanitizeArtifacts = options?.sanitizeArtifacts ?? false;
  const cleanText = (text: string) =>
    sanitizeArtifacts ? sanitizeParsedResumeText(text) : normalizePrintableText(text);
  const empty = createEmptyResume();
  const header = { ...empty.header, ...data.header };
  const { name, title } = normalizeHeaderNameTitle(
    normalizePrintableText(header.name ?? ""),
    normalizePrintableText(header.title ?? "")
  );
  return {
    header: {
      ...header,
      name,
      title,
      phone: normalizePrintableText(header.phone ?? ""),
      email: normalizePrintableText(header.email ?? ""),
      city: normalizePrintableText(header.city ?? ""),
      linkedin: header.linkedin
        ? normalizePrintableText(header.linkedin)
        : header.linkedin,
      portfolio: header.portfolio
        ? normalizePrintableText(header.portfolio)
        : header.portfolio,
      showLinkedin: header.showLinkedin ?? false,
      showPortfolio: header.showPortfolio ?? false,
    },
    summary: normalizePrintableText(data.summary ?? ""),
    experience: (data.experience ?? []).map((e) => {
      const deduped = dedupeExperienceLocation(
        e.company ?? "",
        e.location ?? ""
      );
      return {
        id: e.id || createId(),
        company: deduped.company,
        role: normalizePrintableText(e.role ?? ""),
        location: deduped.location,
        startDate: parseToMonthYear(e.startDate ?? ""),
        endDate: parseToMonthYear(e.endDate ?? ""),
        bullets: (e.bullets ?? []).map((b) => normalizePrintableText(b)),
      };
    }),
    projects: (data.projects ?? []).map((p) => {
      const rawBullets = normalizeProjectBullets(p, sanitizeArtifacts);
      const rawTech = coerceResumeStringList(p.technologies).map((item) =>
        sanitizeArtifacts ? sanitizeParsedResumeText(item) : item
      );
      const partitioned = sanitizeArtifacts
        ? partitionProjectBulletsAndTechnologies(rawBullets, rawTech)
        : { bullets: rawBullets, technologies: rawTech };
      const { bullets, technologies } = partitioned;
      return {
        id: p.id || createId(),
        name: cleanText(p.name ?? ""),
        bullets,
        description: projectDescriptionFromBullets(bullets),
        technologies,
        url: p.url ? cleanText(p.url) : "",
      };
    }),
    education: (data.education ?? []).map((e) => ({
      id: e.id || createId(),
      institution: normalizePrintableText(e.institution ?? ""),
      degree: normalizePrintableText(e.degree ?? ""),
      field: normalizePrintableText(e.field ?? ""),
      startDate: parseToMonthYear(e.startDate ?? ""),
      endDate: parseToMonthYear(e.endDate ?? ""),
      gpa: normalizePrintableText(e.gpa ?? ""),
    })),
    skills: normalizeSkillCategories(data.skills),
    languages: coerceResumeStringList(data.languages),
    customSections: (data.customSections ?? []).map((s) => ({
      id: s.id || createId(),
      title: normalizePrintableText(s.title ?? ""),
      content: normalizePrintableText(s.content ?? ""),
    })),
  };
}
