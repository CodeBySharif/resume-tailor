import type { AtsCheckResult } from "@/lib/ats-types";
import type { JobDetails, LLMSettings, Resume } from "@/lib/resume-schema";
import type { GenerationStyle } from "@/lib/writing-tone";

export async function fetchAtsCheck(
  resume: Resume,
  jobDetails: JobDetails,
  settings: LLMSettings
): Promise<AtsCheckResult> {
  const response = await fetch("/api/ats-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume, jobDetails, settings }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "ATS check failed");
  }

  return data as AtsCheckResult;
}

export async function fetchGeneralAtsCheck(
  resume: Resume,
  settings: LLMSettings
): Promise<AtsCheckResult> {
  const response = await fetch("/api/ats-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume, settings }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "ATS check failed");
  }

  return data as AtsCheckResult;
}

export async function fetchAtsFix(
  resume: Resume,
  atsResult: AtsCheckResult,
  generationStyle: GenerationStyle,
  settings: LLMSettings
): Promise<Resume> {
  const response = await fetch("/api/ats-fix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume, atsResult, generationStyle, settings }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to improve resume");
  }

  return data.resume as Resume;
}
