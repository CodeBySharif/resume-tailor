import { NextRequest, NextResponse } from "next/server";
import { buildAtsFixPrompt } from "@/lib/prompts";
import type { AtsCheckResult } from "@/lib/ats-types";
import { generateJSON, LLMProviderError } from "@/lib/llm/client";
import { validatePrimaryProviderKey } from "@/lib/llm/validate-settings";
import {
  DEFAULT_LLM_SETTINGS,
  normalizeResume,
  type LLMSettings,
  type Resume,
} from "@/lib/resume-schema";
import {
  DEFAULT_GENERATION_STYLE,
  type GenerationStyle,
} from "@/lib/writing-tone";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resume, atsResult, generationStyle, settings } = body as {
      resume: Resume;
      atsResult: AtsCheckResult;
      generationStyle?: Partial<GenerationStyle>;
      settings?: Partial<LLMSettings>;
    };

    if (!resume || !atsResult) {
      return NextResponse.json(
        { error: "Resume and ATS result are required" },
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

    const style: GenerationStyle = {
      ...DEFAULT_GENERATION_STYLE,
      ...generationStyle,
    };

    const normalizedResume = normalizeResume(resume);
    const prompt = buildAtsFixPrompt(normalizedResume, atsResult, style);
    const llm = await generateJSON(prompt, llmSettings);
    const parsed = JSON.parse(llm.text) as { resume: Resume };

    return NextResponse.json({
      resume: normalizeResume(parsed.resume),
      meta: {
        provider: llm.provider,
        totalDurationMs: llm.totalDurationMs,
        attempts: llm.attempts,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to improve resume";
    const attempts =
      error instanceof LLMProviderError ? error.attempts : undefined;
    return NextResponse.json({ error: message, meta: { attempts } }, { status: 500 });
  }
}
