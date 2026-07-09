import { NextRequest, NextResponse } from "next/server";
import {
  buildAtsCheckPrompt,
  buildGeneralAtsCheckPrompt,
} from "@/lib/prompts";
import { normalizeAtsCheckResult } from "@/lib/ats-types";
import { generateJSON, LLMProviderError } from "@/lib/llm/client";
import { validatePrimaryProviderKey } from "@/lib/llm/validate-settings";
import {
  DEFAULT_LLM_SETTINGS,
  normalizeResume,
  type JobDetails,
  type LLMSettings,
  type Resume,
} from "@/lib/resume-schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resume, jobDetails, settings } = body as {
      resume: Resume;
      jobDetails?: JobDetails;
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

    const isJobSpecific =
      jobDetails?.company &&
      jobDetails?.role &&
      jobDetails?.jobDescription?.trim();

    if (isJobSpecific) {
      const prompt = buildAtsCheckPrompt(normalizedResume, jobDetails);
      const llm = await generateJSON(prompt, llmSettings);
      const parsed = JSON.parse(llm.text);
      const result = normalizeAtsCheckResult(parsed);

      return NextResponse.json({
        ...result,
        meta: {
          provider: llm.provider,
          totalDurationMs: llm.totalDurationMs,
          attempts: llm.attempts,
        },
      });
    }

    const prompt = buildGeneralAtsCheckPrompt(normalizedResume);
    const llm = await generateJSON(prompt, llmSettings);
    const parsed = JSON.parse(llm.text);
    const result = normalizeAtsCheckResult(parsed);

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
      error instanceof Error ? error.message : "Failed to run ATS check";
    const attempts =
      error instanceof LLMProviderError ? error.attempts : undefined;
    return NextResponse.json({ error: message, meta: { attempts } }, { status: 500 });
  }
}
