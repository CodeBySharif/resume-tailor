import { NextRequest, NextResponse } from "next/server";
import { buildParseResumePrompt } from "@/lib/prompts";
import { generateJSON, LLMProviderError } from "@/lib/llm/client";
import {
  DEFAULT_LLM_SETTINGS,
  normalizeResume,
  type LLMSettings,
} from "@/lib/resume-schema";
import { validatePrimaryProviderKey } from "@/lib/llm/validate-settings";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, settings } = body as {
      text: string;
      settings?: Partial<LLMSettings>;
    };

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Resume text is required" },
        { status: 400 }
      );
    }

    const llmSettings: LLMSettings = {
      ...DEFAULT_LLM_SETTINGS,
      ...settings,
    };

    const keyError = validatePrimaryProviderKey(llmSettings);
    if (keyError) {
      return NextResponse.json({ error: keyError }, { status: 400 });
    }

    const prompt = buildParseResumePrompt(text);
    const llm = await generateJSON(prompt, llmSettings);
    const parsed = JSON.parse(llm.text);
    const resume = normalizeResume(parsed);

    return NextResponse.json({
      resume,
      meta: {
        provider: llm.provider,
        totalDurationMs: llm.totalDurationMs,
        attempts: llm.attempts,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to parse resume";
    const attempts =
      error instanceof LLMProviderError ? error.attempts : undefined;
    return NextResponse.json({ error: message, meta: { attempts } }, { status: 500 });
  }
}
