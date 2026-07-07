const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 120_000;

export async function generateWithGroq(
  prompt: string,
  apiKey: string
): Promise<string> {
  if (!apiKey) {
    throw new Error("Groq API key is not configured");
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({
          model: GROQ_MODEL,
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
        throw new Error(`Groq error: ${response.status} ${body.slice(0, 200)}`);
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error("Empty response from Groq");

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

  throw lastError ?? new Error("Groq generation failed");
}
