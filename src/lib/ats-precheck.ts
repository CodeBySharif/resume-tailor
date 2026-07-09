import type { Resume } from "@/lib/resume-schema";

export interface AtsPrecheckHints {
  contactComplete: boolean;
  missingContactFields: string[];
  experienceBulletCount: number;
  skillsCount: number;
  summaryWordCount: number;
  hasEducation: boolean;
  hasExperience: boolean;
  emptySections: string[];
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
  };
}

export function formatPrecheckForPrompt(hints: AtsPrecheckHints): string {
  return `Automated pre-check hints (use as ground truth, do not contradict):
- Contact complete: ${hints.contactComplete}${hints.missingContactFields.length ? ` (missing: ${hints.missingContactFields.join(", ")})` : ""}
- Experience bullets: ${hints.experienceBulletCount}
- Skills listed: ${hints.skillsCount}
- Summary word count: ${hints.summaryWordCount}
- Empty sections: ${hints.emptySections.length ? hints.emptySections.join(", ") : "none"}`;
}
