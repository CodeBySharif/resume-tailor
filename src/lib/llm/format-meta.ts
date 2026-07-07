import type { LLMAttempt } from "@/lib/llm/types";

export function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatAttemptLog(attempts: LLMAttempt[]): string {
  return attempts
    .map((a) => {
      const time = formatDurationMs(a.durationMs);
      if (a.ok) return `${a.name} ✓ (${time})`;
      const err = a.error?.slice(0, 120) ?? "failed";
      return `${a.name} ✗ (${time}): ${err}`;
    })
    .join(" → ");
}

export function getLiveProviderHint(
  provider: string,
  elapsedSec: number
): string {
  if (provider === "groq") {
    if (elapsedSec < 5) return "Connecting to Groq…";
    if (elapsedSec < 40) {
      return "Groq is reading your resume and generating tailored content (usually 15–40 seconds)…";
    }
    return "Groq is still processing a large resume — this can take up to 2 minutes.";
  }

  if (provider === "gemini") {
    if (elapsedSec < 5) return "Connecting to Gemini…";
    if (elapsedSec < 30) return "Gemini is tailoring your resume…";
    return "Still waiting — check if your Gemini quota is exhausted.";
  }

  if (provider === "openrouter") {
    if (elapsedSec < 5) return "Connecting to OpenRouter…";
    if (elapsedSec < 45) {
      return "OpenRouter is processing your resume (free models, up to 1M context)…";
    }
    return "OpenRouter is still processing — free tier allows ~50–200 requests/day.";
  }

  return "Processing with AI…";
}

export function getProviderLabel(
  provider: string,
  openrouterModel?: string
): string {
  if (provider === "groq") return "Groq Llama 3.3 70B";
  if (provider === "gemini") return "Gemini 2.5 Flash";
  if (provider === "openrouter") {
    if (openrouterModel === "google/gemini-2.5-flash:free") {
      return "OpenRouter · Gemini 2.5 Flash (1M)";
    }
    if (openrouterModel === "meta-llama/llama-3.3-70b-instruct:free") {
      return "OpenRouter · Llama 3.3 70B";
    }
    if (openrouterModel === "qwen/qwen3-coder:free") {
      return "OpenRouter · Qwen3 Coder (262K)";
    }
    return "OpenRouter (free)";
  }
  return provider;
}
