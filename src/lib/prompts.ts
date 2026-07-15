import type { AtsCheckResult } from "./ats-types";
import type { ResumeSuggestResult } from "./resume-suggest-types";
import { RESUME_SUGGEST_JSON_SCHEMA } from "./resume-suggest-types";
import type { JobDetails, Resume } from "./resume-schema";
import type { GenerationStyle } from "./writing-tone";
import { getToneOption } from "./writing-tone";
import { RESUME_JSON_SCHEMA } from "./resume-schema";
import { ATS_CHECK_JSON_SCHEMA } from "./ats-types";
import {
  buildAtsPrecheckHints,
  formatPrecheckForPrompt,
  getAtsTodayContext,
} from "./ats-precheck";
import { formatRewriteLocksForPrompt } from "./rewrite-locks";

const SHARED_RESUME_WRITING_RULES = `
Metrics rules:
- Only use numbers explicitly stated in the source resume unless metrics-driven mode is active
- If drafting metrics, use conservative, believable estimates — never inflate or exaggerate to impress recruiters
- Avoid round hype numbers (e.g. 99.9% uptime, 10x growth) unless clearly supported by source text
- Prefer qualitative impact when exact figures are unknown

Action verb rules:
- Vary bullet openings across the entire resume
- No action verb (or close synonym) may appear more than twice across all experience bullets combined
- Prefer distinct strong verbs (e.g. Built, Led, Improved, Delivered, Automated, Designed)
`;

export function buildParseResumePrompt(text: string): string {
  return `You are a resume parser. Extract structured data from the following resume text and return valid JSON matching this schema:

${RESUME_JSON_SCHEMA}

Rules:
- Generate a unique UUID for each "id" field
- Preserve all content faithfully; do not invent information
- If a field is missing, use empty string or empty array
- header.name is the person's full name only; header.title is their job title only — never combine them into one field
- Dates should be kept as written (e.g. "Jan 2020", "2021-Present")
- Split bullet points into the bullets array for experience and projects
- projects must use a bullets array (one achievement per bullet), like work experience — not a single paragraph description
- projects.technologies MUST be a JSON array of strings (e.g. [".NET Core", "MVC"]) — one technology per entry, never a plain string, never inside bullets, never commentary
- skills must be an array with one skill per entry — never a single comma-separated string
- languages must be an array of plain strings with proficiency in parentheses (e.g. "English (Native)", "Spanish (Conversational)"), one language per entry — not objects or comma-separated strings
- Return ONLY valid JSON. No explanations, corrections, markdown, or commentary inside the JSON

Example project entry:
{ "id": "uuid", "name": "Paydee E - Financing System", "bullets": ["Developed online loan application workflows with automated document generation and reporting, reducing manual effort and improving compliance."], "technologies": [".NET Core", "MVC"] }

Resume text:
---
${text}
---

Return ONLY valid JSON, no markdown fences.`;
}

export function buildTailorPrompt(
  resume: Resume,
  job: JobDetails,
  style: GenerationStyle,
  rewriteLocks: string[] = []
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
  const preserveResume = style.resumeTone === "preserve";
  const metricsModeNote =
    style.resumeTone === "metrics" || style.coverLetterTone === "metrics"
      ? `
Metrics-driven mode guidance:
- Prioritize quantified impact where the source resume supports it (%, counts, time saved, scale)
- If exact values are missing, add conservative draft placeholders the candidate can verify — never exaggerate
- Keep numbers modest and plausible for the role; misleading metrics are worse than no metrics
`
      : "";

  const resumeInstructions = preserveResume
    ? `Resume instructions (DON'T REWRITE mode):
1. Return the resume nearly identical to the input — preserve wording of summary, bullets, and skills
2. Allowed minimal edits only: obvious typos, consistent date formatting, and lightly surfacing JD keywords that ALREADY appear in the resume
3. Do NOT paraphrase, reorder for style, invent metrics, or change voice
4. Keep the same structure and all id fields unchanged
5. Do NOT fabricate experience, companies, credentials, or technologies
6. The changes array may be empty or list only the tiny edits you made`
    : `Resume instructions:
1. Rewrite the professional summary to align with the role using only truthful experience
2. Reorder and reword experience bullets to highlight relevant skills and achievements the candidate actually has
3. Adjust skills list to emphasize job-relevant skills the candidate already has — do NOT add skills from the job description unless they clearly appear in experience, projects, or the existing skills list
4. Keep the same structure and all id fields unchanged
5. Do NOT fabricate experience, companies, credentials, or technologies
6. If the job asks for skills the candidate lacks, emphasize transferable strengths instead of claiming those skills`;

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
${formatRewriteLocksForPrompt(resume, rewriteLocks)}
${resumeInstructions}

Cover letter instructions:
7. Write a cover letter body (3-4 paragraphs) — do NOT include sender address, date, greeting, or sign-off (the app adds those)
8. Cover letter must not mention any excluded skills/topics listed above
9. If "what excites the candidate" notes are provided, include genuine enthusiasm in the cover letter
10. If skill gap notes are provided, address gaps honestly with transferable strengths — never fabricate qualifications

ATS-friendly output requirements (apply to the tailored resume):
- Use standard section headings and a parseable single-column layout (no tables, columns, or graphics)
- Mirror important keywords from the job description where the candidate genuinely has that experience
- ${preserveResume ? "In don't-rewrite mode, skip stylistic ATS rewrites; only apply keyword surfacing when already supported" : "Lead experience bullets with strong action verbs; include metrics where truthful"}
- Keep contact info complete and skills list focused (roughly 10–25 relevant skills)
- Ensure consistent date formatting and correct grammar/tense throughout
${preserveResume ? "" : SHARED_RESUME_WRITING_RULES}

Return JSON with this exact structure:
{
  "resume": <tailored resume matching schema>,
  "coverLetter": "<cover letter body paragraphs only, no header or signature>",
  "changes": [
    { "section": "<section name>", "field": "<field path>", "before": "<original text>", "after": "<new text>" }
  ]
}

${preserveResume ? "If the resume was left unchanged, return an empty changes array." : "Include at least 3 meaningful changes in the changes array."} Return ONLY valid JSON.`;
}

/** Rewrite a resume in a chosen voice with no job description (edit-resume flow). */
export function buildRewriteResumePrompt(
  resume: Resume,
  style: GenerationStyle,
  rewriteLocks: string[] = []
): string {
  const tone = getToneOption(style.resumeTone);
  return `You are an expert resume editor. Rewrite the resume using the selected voice while staying truthful.

Voice (${tone.label}): ${tone.resumePrompt}

${SHARED_RESUME_WRITING_RULES}

Current Resume (JSON):
${JSON.stringify(resume, null, 2)}
${formatRewriteLocksForPrompt(resume, rewriteLocks)}
Rules:
- Keep the same structure and all id fields unchanged
- Do NOT fabricate experience, companies, credentials, or technologies
- Do not add a job-specific tailoring angle — improve clarity and voice only
- Preserve every LOCKED bullet/summary exactly as provided
- Return ONLY JSON: { "resume": <resume matching schema> }`;
}

/** Rewrite a full cover letter / CV letter in a chosen voice (edit-cover freeform). */
export function buildRewriteCoverPrompt(
  coverLetter: string,
  style: GenerationStyle
): string {
  const tone = getToneOption(style.coverLetterTone);
  return `You are an expert cover letter editor. Rewrite the following letter using the selected voice.

Voice (${tone.label}): ${tone.coverLetterPrompt}

Current letter (full text — may already include header, greeting, and signature):
---
${coverLetter}
---

Rules:
- Return the COMPLETE letter as plain text (not JSON object with fields)
- Preserve the candidate's facts; do not invent employers, roles, or skills
- Keep a natural letter structure (you may keep or lightly refresh greeting and sign-off)
- Return ONLY JSON: { "coverLetter": "<full rewritten letter text>" }`;
}

export function buildAtsCheckPrompt(resume: Resume, job: JobDetails): string {
  const excludeList = job.skillsToExclude
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const excludeSection =
    excludeList.length > 0
      ? `
Skills/topics to NEVER suggest adding (candidate excluded these):
${excludeList.map((s) => `- ${s}`).join("\n")}
`
      : "";

  const precheck = formatPrecheckForPrompt(buildAtsPrecheckHints(resume));

  return `You are an expert ATS resume analyst. Score the resume against the target job using evidence from the resume text only.

Target Job:
- Company: ${job.company}
- Role: ${job.role}
- Job Description:
${job.jobDescription}
${excludeSection}
Resume (JSON):
${JSON.stringify(resume, null, 2)}

${precheck}

Score these 10 categories (weights must sum to 100):
1. keyword_match (20%) — Required/preferred JD terms in summary, skills, experience; include acronym pairs where relevant
2. title_alignment (10%) — Header title and recent role align with target role family
3. quantified_impact (15%) — Share of bullets with metrics (%, $, time, scale, users); flag missing quantification, do NOT invent metrics
4. section_structure (10%) — Standard sections present and populated; skills count ideally 10–25
5. formatting (10%) — Parse-friendly structure: complete contact, consistent dates, no empty blocks
6. experience_depth (10%) — Recent roles relevant to JD; dates and tenure present; seniority fits posting
7. education_certs (5%) — Degree/field/certs from JD reflected when applicable
8. action_verbs (10%) — Strong bullet openings; avoid vague filler ("responsible for", "helped with")
9. repetition (5%) — Overused verbs/phrases across bullets; flag any action verb used more than twice; duplicate skills
10. spelling_grammar (5%) — Typos, grammar, tense consistency (past for past roles, present for current)

Rules:
- Base every finding on actual resume content — cite specific bullets or fields
- Use the pre-check "Today's date" as ground truth for any past/current/future date judgment
- Do NOT flag employment dates as future unless they are after the pre-check today year-month
- overallScore must equal the weighted average of category scores (weight × score / 100)
- status: pass ≥75, warning 55–74, fail <55
- grade: Excellent ≥90, Good ≥75, Fair ≥60, Needs Work <60
- topPriorities: exactly 3 highest-impact fixes, ordered
- Never suggest skills from the exclusion list

Return JSON matching this schema:
${ATS_CHECK_JSON_SCHEMA}

Return ONLY valid JSON, no markdown fences.`;
}

export function buildGeneralAtsCheckPrompt(resume: Resume): string {
  const precheck = formatPrecheckForPrompt(buildAtsPrecheckHints(resume));

  return `You are an expert ATS resume analyst. Score this resume for general ATS-friendliness and recruiter readability — NOT against a specific job description.

Resume (JSON):
${JSON.stringify(resume, null, 2)}

${precheck}

Score these 10 categories (weights must sum to 100):
1. keyword_match (20%) — Skills section clarity, relevant industry terms, and acronym pairs where appropriate (not JD matching)
2. title_alignment (10%) — Professional title present in header and aligned with experience level
3. quantified_impact (15%) — Share of bullets with metrics (%, $, time, scale, users); flag missing quantification, do NOT invent metrics
4. section_structure (10%) — Standard sections present and populated; skills count ideally 10–25
5. formatting (10%) — Parse-friendly structure: complete contact, consistent dates, no tables/columns/graphics
6. experience_depth (10%) — Recent roles with clear dates, tenure, and substantive bullets
7. education_certs (5%) — Education block complete when degrees/certs are listed
8. action_verbs (10%) — Strong bullet openings; avoid vague filler ("responsible for", "helped with")
9. repetition (5%) — Overused verbs/phrases across bullets; flag any action verb used more than twice; duplicate skills
10. spelling_grammar (5%) — Typos, grammar, tense consistency (past for past roles, present for current)

Rules:
- Base every finding on actual resume content — cite specific bullets or fields
- Use the pre-check "Today's date" as ground truth for any past/current/future date judgment
- Do NOT flag employment dates as future unless they are after the pre-check today year-month
- overallScore must equal the weighted average of category scores (weight × score / 100)
- status: pass ≥75, warning 55–74, fail <55
- grade: Excellent ≥90, Good ≥75, Fair ≥60, Needs Work <60
- topPriorities: exactly 3 highest-impact fixes, ordered
- missingKeywords / matchedKeywords: use for industry-relevant terms found or absent in the resume (not JD terms)

Return JSON matching this schema:
${ATS_CHECK_JSON_SCHEMA}

Return ONLY valid JSON, no markdown fences.`;
}

export function buildAtsFixPrompt(
  resume: Resume,
  atsResult: AtsCheckResult,
  style: GenerationStyle,
  rewriteLocks: string[] = []
): string {
  const failingCategories = atsResult.categories.filter(
    (c) => c.status === "fail" || c.status === "warning"
  );
  const resumeTone = getToneOption(style.resumeTone);
  const { todayLabel, todayYearMonth } = getAtsTodayContext();

  return `You are an expert resume writer specializing in ATS-friendly resumes. Improve the resume to address ATS issues identified in the analysis while keeping all claims truthful.

Writing voice — Resume tone (${resumeTone.label}): ${resumeTone.resumePrompt}

Today's date (ground truth): ${todayLabel} (${todayYearMonth})
- Only treat employment dates as future if they are AFTER ${todayYearMonth}
- Do NOT "correct" or rewrite dates that are on or before ${todayYearMonth}
- Ignore any ATS suggestions that wrongly claim past/current dates are future

Current Resume (JSON):
${JSON.stringify(resume, null, 2)}
${formatRewriteLocksForPrompt(resume, rewriteLocks)}
ATS Analysis Summary:
- Overall score: ${atsResult.overallScore}/100 (${atsResult.grade})
- Top priorities: ${atsResult.topPriorities.map((p) => `\n  - ${p}`).join("")}

Categories needing improvement:
${failingCategories
  .map(
    (c) => `
${c.label} (score ${c.score}, status ${c.status}):
Findings: ${c.findings.join("; ") || "—"}
Suggestions: ${c.suggestions.join("; ") || "—"}`
  )
  .join("\n")}

Instructions:
1. Address every fail/warning category using the suggestions and top priorities above
2. Keep the same structure and all id fields unchanged
3. Do NOT fabricate experience, companies, credentials, technologies, or metrics
4. Improve formatting, action verbs, section clarity, and quantification only where supported by existing content
5. Use standard ATS-parseable layout: single column, standard headings, no tables or graphics
6. Strengthen skills presentation and professional summary without inventing skills
7. Preserve valid employment dates; only change dates if they are clearly after ${todayYearMonth} or malformed
8. Preserve every LOCKED bullet/summary exactly as provided — improve only unlocked content
${SHARED_RESUME_WRITING_RULES}

Return JSON with this exact structure:
{
  "resume": <improved resume matching schema>
}

Return ONLY valid JSON, no markdown fences.`;
}

export function buildResumeSuggestPrompt(resume: Resume): string {
  const precheck = formatPrecheckForPrompt(buildAtsPrecheckHints(resume));

  return `You are an expert resume coach helping someone build an ATS-friendly resume from scratch. Analyze the draft resume and suggest what to add or improve. Do NOT invent experience — only suggest based on gaps in what they have written.

Resume (JSON):
${JSON.stringify(resume, null, 2)}

${precheck}

Evaluate these areas:
- summary — professional summary present and compelling
- experience — bullets with action verbs, dates, quantified impact where supported
- skills — clear skills list (ideally 10–25 relevant terms)
- education — complete entries when listed
- formatting — ATS-parseable structure, complete contact info
- action_verbs — variety; flag verbs used more than twice
- metrics — flag exaggerated or missing quantification

Rules:
- priorities: exactly 3 highest-impact improvements, ordered
- sections: group findings and suggestions by resume area
- Be specific — cite what's missing or weak in their draft
- Never suggest fabricating experience, companies, or credentials

Return JSON matching this schema:
${RESUME_SUGGEST_JSON_SCHEMA}

Return ONLY valid JSON, no markdown fences.`;
}

export type ResumeEnhanceMode = "enhance" | "polish";

export function buildResumeEnhancePrompt(
  resume: Resume,
  suggestions: ResumeSuggestResult,
  style: GenerationStyle,
  mode: ResumeEnhanceMode
): string {
  const resumeTone = getToneOption(style.resumeTone);
  const modeInstructions =
    mode === "polish"
      ? `POLISH MODE — Light touch only:
- Fix grammar, spelling, tense consistency, and formatting
- Improve bullet structure and action verb variety
- Do NOT add new experience, companies, skills, projects, or metrics
- Do NOT invent content — only refine what is already present
- Keep all factual claims identical to the source`
      : `ENHANCE MODE — Apply suggestions:
- Address the priorities and section suggestions below using only truthful content
- Expand weak sections the user started but left incomplete
- Do NOT fabricate companies, roles, credentials, or technologies not implied by their draft`;

  return `You are an expert resume writer creating an ATS-friendly resume.

Writing voice — Resume tone (${resumeTone.label}): ${resumeTone.resumePrompt}

${modeInstructions}

Current Resume (JSON):
${JSON.stringify(resume, null, 2)}

AI Suggestions:
Priorities: ${suggestions.priorities.map((p) => `\n- ${p}`).join("")}
${suggestions.sections
  .map(
    (s) => `
${s.label}:
Findings: ${s.findings.join("; ") || "—"}
Suggestions: ${s.suggestions.join("; ") || "—"}`
  )
  .join("\n")}

Instructions:
1. Keep the same structure and all id fields unchanged
2. Use standard ATS-parseable single-column layout
3. Do NOT fabricate experience the user did not provide
${SHARED_RESUME_WRITING_RULES}

Return JSON with this exact structure:
{
  "resume": <improved resume matching schema>
}

Return ONLY valid JSON, no markdown fences.`;
}
