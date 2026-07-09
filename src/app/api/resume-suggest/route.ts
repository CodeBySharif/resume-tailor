import { NextRequest, NextResponse } from "next/server";
import { buildResumeSuggestPrompt } from "@/lib/prompts";
import { normalizeResumeSuggestResult } from "@/lib/resume-suggest-types";
import { generateJSON, LLMProviderError } from "@/lib/llm/client";
import { validatePrimaryProviderKey } from "@/lib/llm/validate-settings";
import {
  DEFAULT_LLM_SETTINGS,
  normalizeResume,
  type LLMSettings,
  type Resume,
} from "@/lib/resume-schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resume, settings } = body as {
      resume: Resume;
      settings?: Partial<LLMSettings>;
    };

    if (!resume) {
      return NextResponse.json({ error: "Resume is required" }, { status: 400 });
    }

    const llmSettings: LLMSettings = {
      ...DEFAULT_LLM_SETTINGS,
      ...settings,
    };

    const keyError = validatePrimaryProviderKey(llmSettings);
    if (keyError) {
      return NextResponse.json({ error: keyError }, { status: 400 });
    }

    const normalizedResume = normalizeResume(resume);
    const prompt = buildResumeSuggestPrompt(normalizedResume);
    const llm = await generateJSON(prompt, llmSettings);
    const parsed = JSON.parse(llm.text);
    const result = normalizeResumeSuggestResult(parsed);

    return NextResponse.json({
      ...result,
      meta: {
        provider: llm.provider,
        totalDurationMs: llm.totalDurationMs,
        attempts: llm.attempts,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get suggestions";
    const attempts =
      error instanceof LLMProviderError ? error.attempts : undefined;
    return NextResponse.json({ error: message, meta: { attempts } }, { status: 500 });
  }
}
