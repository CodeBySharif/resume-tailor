import type { ResumeSuggestResult } from "@/lib/resume-suggest-types";
import type { LLMSettings, Resume } from "@/lib/resume-schema";
import type { GenerationStyle } from "@/lib/writing-tone";
import type { ResumeEnhanceMode } from "@/lib/prompts";

export async function fetchResumeSuggest(
  resume: Resume,
  settings: LLMSettings
): Promise<ResumeSuggestResult> {
  const response = await fetch("/api/resume-suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume, settings }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to get suggestions");
  }

  return data as ResumeSuggestResult;
}

export async function fetchResumeEnhance(
  resume: Resume,
  suggestions: ResumeSuggestResult,
  generationStyle: GenerationStyle,
  mode: ResumeEnhanceMode,
  settings: LLMSettings
): Promise<Resume> {
  const response = await fetch("/api/resume-enhance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume, suggestions, generationStyle, mode, settings }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to enhance resume");
  }

  return data.resume as Resume;
}
