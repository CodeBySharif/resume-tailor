const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const DEFAULT_OPENROUTER_MODEL = "openrouter/free";
const MAX_RETRIES_PER_MODEL = 1;
const MAX_UPSTREAM_FALLBACKS = 3;
const REQUEST_TIMEOUT_MS = 120_000;

/**
 * Specific free models to try after openrouter/free hits a temporary upstream limit.
 * Free catalog churns — keep IDs that are commonly available; 404s skip to the next.
 * @see https://openrouter.ai/docs/guides/routing/routers/free-router
 */
const FREE_MODEL_FALLBACKS = [
  "openai/gpt-oss-20b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-coder:free",
] as const;

/** Models that OpenRouter no longer serves — force Settings back to Auto. */
const RETIRED_OPENROUTER_MODELS = new Set([
  "nvidia/nemotron-nano-9b-v2:free",
  "google/gemini-2.5-flash:free",
]);

export const OPENROUTER_MODEL_PRESETS = [
  {
    label: "Auto (free, recommended)",
    value: "openrouter/free",
    context: "varies",
    description: "OpenRouter picks the best available free model for you",
  },
  {
    label: "GPT-OSS 20B (free)",
    value: "openai/gpt-oss-20b:free",
    context: "128K",
    description: "OpenAI open-weight model, good general quality",
  },
  {
    label: "Nemotron 3 Nano (free)",
    value: "nvidia/nemotron-3-nano-30b-a3b:free",
    context: "256K",
    description: "NVIDIA compact model, fast responses",
  },
  {
    label: "Nemotron 3 Super (free)",
    value: "nvidia/nemotron-3-super-120b-a12b:free",
    context: "256K",
    description: "NVIDIA larger model, stronger reasoning",
  },
  {
    label: "Llama 3.3 70B (free)",
    value: "meta-llama/llama-3.3-70b-instruct:free",
    context: "128K",
    description: "Meta general-purpose model",
  },
  {
    label: "Qwen3 Coder (free)",
    value: "qwen/qwen3-coder:free",
    context: "262K",
    description: "Alibaba coding-focused model",
  },
] as const;

/** Normalize stored Settings model if OpenRouter retired it. */
export function sanitizeOpenRouterModel(model: string | undefined | null): string {
  const value = (model ?? "").trim() || DEFAULT_OPENROUTER_MODEL;
  if (RETIRED_OPENROUTER_MODELS.has(value)) {
    return DEFAULT_OPENROUTER_MODEL;
  }
  const known = OPENROUTER_MODEL_PRESETS.some((p) => p.value === value);
  if (!known && value !== DEFAULT_OPENROUTER_MODEL) {
    // Keep custom IDs, but retired ones already handled above
    return value;
  }
  return value;
}

function resolveModels(model: string): string[] {
  const primary = sanitizeOpenRouterModel(model || DEFAULT_OPENROUTER_MODEL);
  const fallbacks = FREE_MODEL_FALLBACKS.slice(0, MAX_UPSTREAM_FALLBACKS);

  if (primary === "openrouter/free") {
    return ["openrouter/free", ...fallbacks];
  }

  // Pinned model first; if it 404s / fails, fall through Auto + free backups
  return [
    primary,
    "openrouter/free",
    ...fallbacks.filter((m) => m !== primary),
  ];
}

function isDailyQuotaExceeded(body: string, message: string): boolean {
  const text = `${body} ${message}`.toLowerCase();
  return text.includes("free-models-per-day");
}

function isUpstreamRateLimited(body: string, message: string): boolean {
  const text = `${body} ${message}`.toLowerCase();
  return (
    text.includes("temporarily rate-limited") ||
    text.includes("provider returned error")
  );
}

/** Model removed from OpenRouter catalog — skip to next candidate. */
function isMissingEndpoint(
  status: number,
  body: string,
  message: string
): boolean {
  if (status !== 404) return false;
  const text = `${body} ${message}`.toLowerCase();
  return (
    text.includes("no endpoints found") ||
    text.includes("not found") ||
    text.includes("no endpoints")
  );
}

function isRetryableRateLimit(
  status: number,
  body: string,
  message: string
): boolean {
  if (status !== 429) return false;
  if (isDailyQuotaExceeded(body, message)) return false;
  return isUpstreamRateLimited(body, message) || /rate[- ]limit/i.test(message);
}

function dailyQuotaMessage(): string {
  return (
    "OpenRouter daily free limit reached (50 requests/day without credits). " +
    "Each generate/parse uses 1+ API calls — Auto retries can use more. " +
    "Limit resets at midnight UTC, or add $10 credits at openrouter.ai/settings/credits " +
    "to unlock 1,000 free requests/day permanently."
  );
}

function upstreamRateLimitMessage(): string {
  return (
    "OpenRouter free models are temporarily busy. Wait 1–2 minutes and retry, " +
    "or pin a specific model in Settings."
  );
}

async function callOpenRouter(
  prompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-OpenRouter-Title": "Resume Tailor",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Respond with valid JSON only, no markdown fences.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 8192,
    }),
  });

  const body = await response.text();

  if (!response.ok) {
    const err = new Error(
      `OpenRouter error: ${response.status} ${body.slice(0, 200)}`
    );
    (err as Error & { status?: number; body?: string }).status =
      response.status;
    (err as Error & { status?: number; body?: string }).body = body;
    throw err;
  }

  const data = JSON.parse(body) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Empty response from OpenRouter");

  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
  JSON.parse(cleaned);
  return cleaned;
}

function getErrorMeta(err: unknown): { status?: number; body?: string } {
  if (err instanceof Error) {
    const tagged = err as Error & { status?: number; body?: string };
    return { status: tagged.status, body: tagged.body };
  }
  return {};
}

export async function generateWithOpenRouter(
  prompt: string,
  apiKey: string,
  model: string = DEFAULT_OPENROUTER_MODEL
): Promise<string> {
  if (!apiKey) {
    throw new Error("OpenRouter API key is not configured");
  }

  const models = resolveModels(model);
  const errors: string[] = [];
  let sawUpstreamRateLimit = false;

  for (const candidate of models) {
    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        return await callOpenRouter(prompt, apiKey, candidate);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const { status, body = "" } = getErrorMeta(err);
        errors.push(`${candidate}: ${msg}`);

        if (isDailyQuotaExceeded(body, msg)) {
          throw new Error(dailyQuotaMessage());
        }

        // Retired / unavailable model — try the next candidate immediately
        if (isMissingEndpoint(status ?? 0, body, msg)) {
          break;
        }

        if (isRetryableRateLimit(status ?? 0, body, msg)) {
          sawUpstreamRateLimit = true;
          await new Promise((r) => setTimeout(r, 2000));
          break;
        }

        if (attempt < MAX_RETRIES_PER_MODEL) {
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    }
  }

  if (sawUpstreamRateLimit) {
    throw new Error(upstreamRateLimitMessage());
  }

  const summary =
    errors.length > 1
      ? `All OpenRouter models failed. Last: ${errors.at(-1)}. Tried: ${errors
          .map((e) => e.split(":")[0])
          .join(" → ")}`
      : errors.at(-1);

  throw new Error(summary ?? "OpenRouter generation failed");
}

export function getOpenRouterModelLabel(model: string): string {
  const resolved = sanitizeOpenRouterModel(model);
  const preset = OPENROUTER_MODEL_PRESETS.find((p) => p.value === resolved);
  if (preset) return preset.label;
  return "OpenRouter (free)";
}
