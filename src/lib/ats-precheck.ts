import type { Resume } from "@/lib/resume-schema";

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export interface AtsPrecheckHints {
  contactComplete: boolean;
  missingContactFields: string[];
  experienceBulletCount: number;
  skillsCount: number;
  summaryWordCount: number;
  hasEducation: boolean;
  hasExperience: boolean;
  emptySections: string[];
  /** Current calendar month as YYYY-MM (ground truth for date checks) */
  todayYearMonth: string;
  /** Human-readable current month, e.g. "July 2026" */
  todayLabel: string;
}

export function getAtsTodayContext(now: Date = new Date()): {
  todayYearMonth: string;
  todayLabel: string;
} {
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const month = String(monthIndex + 1).padStart(2, "0");
  return {
    todayYearMonth: `${year}-${month}`,
    todayLabel: `${MONTH_LABELS[monthIndex]} ${year}`,
  };
}

export function buildAtsPrecheckHints(resume: Resume): AtsPrecheckHints {
  const missingContactFields: string[] = [];
  if (!resume.header.name?.trim()) missingContactFields.push("name");
  if (!resume.header.email?.trim()) missingContactFields.push("email");
  if (!resume.header.phone?.trim()) missingContactFields.push("phone");
  if (!resume.header.title?.trim()) missingContactFields.push("title");

  const experienceBulletCount = resume.experience.reduce(
    (sum, exp) => sum + exp.bullets.filter((b) => b.trim()).length,
    0
  );

  const emptySections: string[] = [];
  if (!resume.summary?.trim()) emptySections.push("summary");
  if (resume.experience.length === 0) emptySections.push("experience");
  if (resume.skills.length === 0) emptySections.push("skills");
  if (resume.education.length === 0) emptySections.push("education");

  const { todayYearMonth, todayLabel } = getAtsTodayContext();

  return {
    contactComplete: missingContactFields.length === 0,
    missingContactFields,
    experienceBulletCount,
    skillsCount: resume.skills.length,
    summaryWordCount: resume.summary?.trim()
      ? resume.summary.trim().split(/\s+/).length
      : 0,
    hasEducation: resume.education.length > 0,
    hasExperience: resume.experience.length > 0,
    emptySections,
    todayYearMonth,
    todayLabel,
  };
}

export function formatPrecheckForPrompt(hints: AtsPrecheckHints): string {
  return `Automated pre-check hints (use as ground truth, do not contradict):
- Today's date: ${hints.todayLabel} (${hints.todayYearMonth})
- Contact complete: ${hints.contactComplete}${hints.missingContactFields.length ? ` (missing: ${hints.missingContactFields.join(", ")})` : ""}
- Experience bullets: ${hints.experienceBulletCount}
- Skills listed: ${hints.skillsCount}
- Summary word count: ${hints.summaryWordCount}
- Empty sections: ${hints.emptySections.length ? hints.emptySections.join(", ") : "none"}

Date rules (mandatory):
- Treat ${hints.todayLabel} as "now" — ignore any assumed year from model training
- A date is "future" ONLY if its year-month is AFTER ${hints.todayYearMonth}
- Dates in 2025 or early/mid 2026 that are on or before ${hints.todayYearMonth} are valid past or current dates — do NOT flag them as future
- "Present" / ongoing roles are valid; do not treat them as future dates
- Prefer experience listed newest-first; only mention order if clearly wrong`;
}
