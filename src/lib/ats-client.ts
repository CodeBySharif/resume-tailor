import { readJsonResponse } from "@/lib/api-response";
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

  const data = await readJsonResponse<AtsCheckResult & { error?: string }>(
    response
  );
  if (!response.ok) {
    throw new Error(data.error || "ATS check failed");
  }

  return data;
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

  const data = await readJsonResponse<AtsCheckResult & { error?: string }>(
    response
  );
  if (!response.ok) {
    throw new Error(data.error || "ATS check failed");
  }

  return data;
}

export async function fetchAtsFix(
  resume: Resume,
  atsResult: AtsCheckResult,
  generationStyle: GenerationStyle,
  settings: LLMSettings,
  rewriteLocks: string[] = []
): Promise<Resume> {
  const response = await fetch("/api/ats-fix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume,
      atsResult,
      generationStyle,
      settings,
      rewriteLocks,
    }),
  });

  const data = await readJsonResponse<{ resume?: Resume; error?: string }>(
    response
  );
  if (!response.ok) {
    throw new Error(data.error || "Failed to improve resume");
  }

  if (!data.resume) {
    throw new Error("Failed to improve resume");
  }

  return data.resume;
}
