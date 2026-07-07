import type { LLMProvider, LLMSettings } from "@/lib/resume-schema";

const PROVIDER_LABELS: Record<LLMProvider, string> = {
  openrouter: "OpenRouter",
  groq: "Groq",
  gemini: "Gemini",
};

export function getApiKeyForProvider(
  settings: LLMSettings,
  provider: LLMProvider = settings.provider
): string {
  switch (provider) {
    case "openrouter":
      return settings.openrouterApiKey.trim();
    case "groq":
      return settings.groqApiKey.trim();
    case "gemini":
      return settings.geminiApiKey.trim();
  }
}

export function validatePrimaryProviderKey(settings: LLMSettings): string | null {
  const key = getApiKeyForProvider(settings);
  if (!key) {
    const label = PROVIDER_LABELS[settings.provider];
    return `No ${label} API key found. Open Settings and add your API key — it will be saved in this browser only.`;
  }
  return null;
}

export function hasConfiguredApiKey(settings: LLMSettings): boolean {
  return validatePrimaryProviderKey(settings) === null;
}
