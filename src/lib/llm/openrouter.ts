const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openrouter/free";
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 120_000;

export const OPENROUTER_MODEL_PRESETS = [
  {
    label: "Auto (free, recommended)",
    value: "openrouter/free",
    context: "varies",
  },
  {
    label: "Gemini 2.5 Flash (free)",
    value: "google/gemini-2.5-flash:free",
    context: "1M",
  },
  {
    label: "Llama 3.3 70B (free)",
    value: "meta-llama/llama-3.3-70b-instruct:free",
    context: "128K",
  },
  {
    label: "Qwen3 Coder (free)",
    value: "qwen/qwen3-coder:free",
    context: "262K",
  },
] as const;

export async function generateWithOpenRouter(
  prompt: string,
  apiKey: string,
  model: string = DEFAULT_MODEL
): Promise<string> {
  if (!apiKey) {
    throw new Error("OpenRouter API key is not configured");
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
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
          model: model || DEFAULT_MODEL,
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

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `OpenRouter error: ${response.status} ${body.slice(0, 200)}`
        );
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error("Empty response from OpenRouter");

      const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
      JSON.parse(cleaned);
      return cleaned;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }

  throw lastError ?? new Error("OpenRouter generation failed");
}
