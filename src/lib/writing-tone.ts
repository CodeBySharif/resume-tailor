export type WritingTone =
  | "preserve"
  | "professional"
  | "metrics"
  | "concise"
  | "technical"
  | "impact"
  | "warm";

export interface WritingToneOption {
  id: WritingTone;
  label: string;
  description: string;
  resumeExample: string;
  coverLetterExample: string;
  resumePrompt: string;
  coverLetterPrompt: string;
}

export const WRITING_TONES: WritingToneOption[] = [
  {
    id: "preserve",
    label: "Don't rewrite",
    description:
      "Keep original wording. Only light structure / keyword alignment when needed.",
    resumeExample:
      "Developed and maintained internal web applications using React and Node.js, collaborating with cross-functional teams to deliver features on schedule.",
    coverLetterExample:
      "I am applying for the Software Developer role at Acme Corp. My experience building web applications matches the skills listed in the job description.",
    resumePrompt:
      "PRESERVE the candidate's original wording as much as possible. Do not paraphrase for style. Only make minimal edits for ATS keyword alignment when clearly supported by existing content, or fix obvious typos. Prefer leaving bullets and summary unchanged.",
    coverLetterPrompt:
      "Write a short, plain, factual cover letter. Avoid stylistic flourish. Stick to clear fit statements with little polish — nearly draft-quality, not a rewrite for voice.",
  },
  {
    id: "professional",
    label: "Professional",
    description: "Balanced, polished, ATS-friendly. Clear and credible.",
    resumeExample:
      "Developed and maintained internal web applications using React and Node.js, collaborating with cross-functional teams to deliver features on schedule.",
    coverLetterExample:
      "I am excited to apply for the Software Developer role at Acme Corp. My experience building scalable web applications aligns well with your team's focus on reliable product delivery.",
    resumePrompt:
      "Use a polished, professional tone. Clear action verbs, complete sentences in summary, credible and ATS-friendly. Avoid hype or slang.",
    coverLetterPrompt:
      "Write in a professional, confident tone. Formal but approachable. Focus on fit and relevant experience.",
  },
  {
    id: "metrics",
    label: "Metrics-Driven",
    description:
      "Highlights numbers and measurable outcomes. Generates quantified draft values for stronger impact.",
    resumeExample:
      "Optimized API response times by 30% through query caching and database indexing, reducing average load from 800ms to 560ms.",
    coverLetterExample:
      "In my previous role, I improved deployment frequency by reducing release cycle time, which helped the team ship features faster with fewer production issues.",
    resumePrompt:
      "Lead with quantified outcomes. Prefer concrete percentages, counts, scale, and time savings in resume bullets. If source content lacks metrics, generate realistic draft numbers to make impact explicit so the candidate can refine them in review.",
    coverLetterPrompt:
      "Use measurable achievements and numeric outcomes where possible. If exact numbers are missing, include realistic draft figures that the candidate can adjust later. Tie results to the employer's goals.",
  },
  {
    id: "concise",
    label: "Concise",
    description: "Short, punchy bullets. Every word earns its place.",
    resumeExample:
      "Built React dashboards for 50+ internal users. Cut report generation time with automated exports.",
    coverLetterExample:
      "I build reliable web apps with React and Node.js. Your team's focus on clean architecture matches how I work — I'd welcome the chance to contribute.",
    resumePrompt:
      "Keep bullets short and high-density. Trim filler words. One strong idea per bullet. Tight summary (2–3 lines max).",
    coverLetterPrompt:
      "Keep paragraphs short and direct. No fluff. Get to the point quickly while staying professional.",
  },
  {
    id: "technical",
    label: "Technical",
    description: "Emphasizes stack, architecture, and engineering depth.",
    resumeExample:
      "Designed REST APIs with Node.js and PostgreSQL; implemented JWT auth, Redis caching, and Docker-based CI/CD pipelines for microservices deployment.",
    coverLetterExample:
      "Your stack — TypeScript, React, and cloud-native services — closely matches the systems I've built. I'm particularly drawn to roles where solid architecture and maintainable code matter.",
    resumePrompt:
      "Highlight technologies, patterns, and engineering decisions truthfully. Name relevant tools from the candidate's actual experience. Suitable for technical roles.",
    coverLetterPrompt:
      "Show genuine technical understanding. Reference specific tools or approaches from the job description only when the candidate has real experience with them.",
  },
  {
    id: "impact",
    label: "Impact-Focused",
    description:
      "Outcome-oriented without forcing numbers. Business value and user benefit.",
    resumeExample:
      "Delivered a self-service reporting tool that reduced dependency on the data team and enabled faster business decisions across departments.",
    coverLetterExample:
      "I focus on work that makes a visible difference — whether that's smoother user experiences, faster workflows, or tools that help teams move with less friction.",
    resumePrompt:
      "Emphasize outcomes, user benefit, and business value. Use qualitative impact when metrics are unavailable. Do not invent percentages.",
    coverLetterPrompt:
      "Connect the candidate's contributions to meaningful outcomes for users, teams, or the business. Enthusiastic but grounded.",
  },
  {
    id: "warm",
    label: "Warm & Engaging",
    description: "Personable and human. Best for cover letters; light touch on resume.",
    resumeExample:
      "Partnered with product and design to ship features users rely on daily, bringing a collaborative mindset and clear communication to every sprint.",
    coverLetterExample:
      "What drew me to this role is the chance to work on products that genuinely help people — that mission resonates with how I've approached every project in my career.",
    resumePrompt:
      "Slightly warmer wording while staying professional. Highlight collaboration and ownership. Avoid being overly casual on the resume.",
    coverLetterPrompt:
      "Warm, genuine, and personable. Show enthusiasm and cultural fit. Conversational professionalism — like a strong human-written letter.",
  },
];

export const DEFAULT_RESUME_TONE: WritingTone = "professional";
export const DEFAULT_COVER_LETTER_TONE: WritingTone = "warm";
/** Default for edit flows — skip AI rewrite unless the user picks a voice. */
export const DEFAULT_EDIT_RESUME_TONE: WritingTone = "preserve";
export const DEFAULT_EDIT_COVER_TONE: WritingTone = "preserve";

export interface GenerationStyle {
  resumeTone: WritingTone;
  coverLetterTone: WritingTone;
}

export const DEFAULT_GENERATION_STYLE: GenerationStyle = {
  resumeTone: DEFAULT_RESUME_TONE,
  coverLetterTone: DEFAULT_COVER_LETTER_TONE,
};

export function getToneOption(id: WritingTone): WritingToneOption {
  return WRITING_TONES.find((t) => t.id === id) ?? WRITING_TONES[0];
}

export function isPreserveTone(id: WritingTone): boolean {
  return id === "preserve";
}

export function getToneLabel(id: WritingTone): string {
  return getToneOption(id).label;
}
