import { NextRequest, NextResponse } from "next/server";
import { generateWithGemini } from "@/lib/llm/gemini";
import { generateWithGroq } from "@/lib/llm/groq";
import { generateWithOpenRouter } from "@/lib/llm/openrouter";
import { validatePrimaryProviderKey } from "@/lib/llm/validate-settings";
import { DEFAULT_LLM_SETTINGS, type LLMSettings } from "@/lib/resume-schema";

const TEST_PROMPT =
  'Return JSON: {"status":"ok","message":"Connection works"}';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body as { settings?: Partial<LLMSettings> };

    const llmSettings: LLMSettings = {
      ...DEFAULT_LLM_SETTINGS,
      ...settings,
    };

    const keyError = validatePrimaryProviderKey(llmSettings);
    if (keyError) {
      return NextResponse.json({ ok: false, error: keyError }, { status: 400 });
    }

    const start = Date.now();
    let text: string;
    let provider: string;

    if (llmSettings.provider === "openrouter") {
      text = await generateWithOpenRouter(
        TEST_PROMPT,
        llmSettings.openrouterApiKey,
        llmSettings.openrouterModel
      );
      provider = "OpenRouter";
    } else if (llmSettings.provider === "groq") {
      text = await generateWithGroq(TEST_PROMPT, llmSettings.groqApiKey);
      provider = "Groq";
    } else {
      text = await generateWithGemini(TEST_PROMPT, llmSettings.geminiApiKey);
      provider = "Gemini";
    }

    const parsed = JSON.parse(text) as { status?: string; message?: string };
    const totalDurationMs = Date.now() - start;

    return NextResponse.json({
      ok: true,
      provider,
      message: parsed.message ?? "Connection successful",
      totalDurationMs,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "LLM connection test failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
