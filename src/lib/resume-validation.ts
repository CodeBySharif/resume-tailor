import type { Resume } from "./resume-schema";

export function getResumeBuildMissingFields(resume: Resume): string[] {
  const missing: string[] = [];

  if (!resume.header.name.trim()) missing.push("Full name");
  if (!resume.header.email.trim()) missing.push("Email address");
  if (!resume.summary.trim()) missing.push("Professional summary");

  const hasExperience = resume.experience.some(
    (entry) => entry.company.trim() && entry.role.trim()
  );
  if (!hasExperience) {
    missing.push("At least one experience (company and role)");
  }

  const hasEducation = resume.education.some(
    (entry) => entry.institution.trim() && entry.degree.trim()
  );
  if (!hasEducation) {
    missing.push("At least one education (institution and degree)");
  }

  return missing;
}
