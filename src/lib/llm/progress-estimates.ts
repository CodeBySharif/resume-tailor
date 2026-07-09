import type { LLMProvider } from "@/lib/resume-schema";

/** Estimated AI phase duration — progress bar reaches ~90% over this time */
export function getParseDurationMs(provider: LLMProvider): number {
  switch (provider) {
    case "gemini":
      return 28_000;
    case "groq":
      return 45_000;
    case "openrouter":
      return 55_000;
    default:
      return 55_000;
  }
}

export function getTailorDurationMs(provider: LLMProvider): number {
  switch (provider) {
    case "gemini":
      return 35_000;
    case "groq":
      return 50_000;
    case "openrouter":
      return 65_000;
    default:
      return 65_000;
  }
}

export function getAtsCheckDurationMs(provider: LLMProvider): number {
  switch (provider) {
    case "gemini":
      return 25_000;
    case "groq":
      return 40_000;
    case "openrouter":
      return 50_000;
    default:
      return 50_000;
  }
}

export const PDF_READ_DURATION_MS = 4_000;
