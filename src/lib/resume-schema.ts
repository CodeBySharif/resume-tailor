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

export interface Resume {
  header: ResumeHeader;
  summary: string;
  experience: Experience[];
  projects: Project[];
  education: Education[];
  skills: string[];
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
    skills: [],
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
    skills: [],
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
      "JavaScript",
      "TypeScript",
      "React",
      "Node.js",
      "Python",
      "AWS",
      "PostgreSQL",
      "Docker",
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
  "skills": ["string"],
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
    skills: coerceResumeStringList(data.skills),
    languages: coerceResumeStringList(data.languages),
    customSections: (data.customSections ?? []).map((s) => ({
      id: s.id || createId(),
      title: normalizePrintableText(s.title ?? ""),
      content: normalizePrintableText(s.content ?? ""),
    })),
  };
}
