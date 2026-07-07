import type { JobDetails, Resume } from "./resume-schema";
import type { GenerationStyle } from "./writing-tone";
import { getToneOption } from "./writing-tone";
import { RESUME_JSON_SCHEMA } from "./resume-schema";

export function buildParseResumePrompt(text: string): string {
  return `You are a resume parser. Extract structured data from the following resume text and return valid JSON matching this schema:

${RESUME_JSON_SCHEMA}

Rules:
- Generate a unique UUID for each "id" field
- Preserve all content faithfully; do not invent information
- If a field is missing, use empty string or empty array
- header.name is the person's full name only; header.title is their job title only — never combine them into one field
- Dates should be kept as written (e.g. "Jan 2020", "2021-Present")
- Split bullet points into the bullets array
- languages must be an array of plain strings (e.g. "English (Native)"), not objects

Resume text:
---
${text}
---

Return ONLY valid JSON, no markdown fences.`;
}

export function buildTailorPrompt(
  resume: Resume,
  job: JobDetails,
  style: GenerationStyle
): string {
  const excludeList = job.skillsToExclude
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const excludeSection =
    excludeList.length > 0
      ? `
Skills/topics to NEVER add or mention (not in the candidate's background):
${excludeList.map((s) => `- ${s}`).join("\n")}
`
      : "";

  const excitesSection = job.whatExcitesYou.trim()
    ? `
What excites the candidate about this role/company (weave into cover letter if natural):
${job.whatExcitesYou.trim()}
`
    : "";

  const gapsSection = job.skillGaps.trim()
    ? `
Requirements the candidate does NOT fully meet (acknowledge honestly in cover letter — emphasize transferable skills, do NOT claim expertise they lack):
${job.skillGaps.trim()}
`
    : "";

  const resumeTone = getToneOption(style.resumeTone);
  const coverTone = getToneOption(style.coverLetterTone);
  const metricsModeNote =
    style.resumeTone === "metrics" || style.coverLetterTone === "metrics"
      ? `
Metrics-driven mode guidance:
- Prioritize quantified impact (%, counts, volume, speed, time saved, uptime, etc.).
- If exact values are not provided in source text, include realistic draft numbers so the candidate can fine-tune them during review.
- Keep numbers plausible for the role and responsibilities.
`
      : "";

  return `You are an expert resume writer and career coach. Tailor the following resume for the target job. Optimize for ATS (Applicant Tracking Systems) while keeping all claims truthful.

Writing voice:
- Resume tone (${resumeTone.label}): ${resumeTone.resumePrompt}
- Cover letter tone (${coverTone.label}): ${coverTone.coverLetterPrompt}
${metricsModeNote}

Target Job:
- Company: ${job.company}
- Role: ${job.role}
- Job Description:
${job.jobDescription}
${excludeSection}${excitesSection}${gapsSection}
Current Resume (JSON):
${JSON.stringify(resume, null, 2)}

Instructions:
1. Rewrite the professional summary to align with the role using only truthful experience
2. Reorder and reword experience bullets to highlight relevant skills and achievements the candidate actually has
3. Adjust skills list to emphasize job-relevant skills the candidate already has — do NOT add skills from the job description unless they clearly appear in experience, projects, or the existing skills list
4. Keep the same structure and all id fields unchanged
5. Do NOT fabricate experience, companies, credentials, or technologies
6. If the job asks for skills the candidate lacks, emphasize transferable strengths instead of claiming those skills
7. Write a professional cover letter body (3-4 paragraphs) — do NOT include sender address, date, greeting, or sign-off (the app adds those)
8. Cover letter must not mention any excluded skills/topics listed above
9. If "what excites the candidate" notes are provided, include genuine enthusiasm in the cover letter
10. If skill gap notes are provided, address gaps honestly with transferable strengths — never fabricate qualifications

Return JSON with this exact structure:
{
  "resume": <tailored resume matching schema>,
  "coverLetter": "<cover letter body paragraphs only, no header or signature>",
  "changes": [
    { "section": "<section name>", "field": "<field path>", "before": "<original text>", "after": "<new text>" }
  ]
}

Include at least 3 meaningful changes in the changes array. Return ONLY valid JSON.`;
}
