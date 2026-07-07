import type { LLMSettings } from "../resume-schema";
import { generateWithGemini } from "./gemini";
import { generateWithGroq } from "./groq";
import { generateWithOpenRouter } from "./openrouter";
import { getApiKeyForProvider } from "./validate-settings";
import {
  LLMProviderError,
  type LLMAttempt,
  type LLMGenerateResult,
} from "./types";

export type { LLMAttempt, LLMGenerateResult };
export { LLMProviderError };

async function tryProviders(
  attempts: Array<{ name: string; run: () => Promise<string> }>
): Promise<LLMGenerateResult> {
  const attemptLog: LLMAttempt[] = [];
  const errors: string[] = [];
  const totalStart = Date.now();

  for (const attempt of attempts) {
    const start = Date.now();
    try {
      const text = await attempt.run();
      attemptLog.push({
        name: attempt.name,
        ok: true,
        durationMs: Date.now() - start,
      });
      return {
        text,
        provider: attempt.name,
        attempts: attemptLog,
        totalDurationMs: Date.now() - totalStart,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      attemptLog.push({
        name: attempt.name,
        ok: false,
        error: msg,
        durationMs: Date.now() - start,
      });
      errors.push(`${attempt.name}: ${msg}`);
    }
  }

  throw new LLMProviderError(
    errors.join(" | ") || "All LLM providers failed",
    attemptLog
  );
}

export async function generateJSON(
  prompt: string,
  settings: LLMSettings
): Promise<LLMGenerateResult> {
  const geminiKey = getApiKeyForProvider(settings, "gemini");
  const groqKey = getApiKeyForProvider(settings, "groq");
  const openrouterKey = getApiKeyForProvider(settings, "openrouter");

  const gemini = () => generateWithGemini(prompt, geminiKey);
  const groq = () => generateWithGroq(prompt, groqKey);
  const openrouter = () =>
    generateWithOpenRouter(prompt, openrouterKey, settings.openrouterModel);

  const withGemini = geminiKey ? [{ name: "Gemini", run: gemini }] : [];
  const withGroq = groqKey ? [{ name: "Groq", run: groq }] : [];
  const withOpenRouter = openrouterKey
    ? [{ name: "OpenRouter", run: openrouter }]
    : [];

  if (settings.provider === "openrouter") {
    return tryProviders([...withOpenRouter, ...withGroq, ...withGemini]);
  }

  if (settings.provider === "groq") {
    return tryProviders([...withGroq, ...withOpenRouter, ...withGemini]);
  }

  return tryProviders([...withGemini, ...withOpenRouter, ...withGroq]);
}
