import { NextRequest, NextResponse } from "next/server";
import { buildCoverLetterOnlyPrompt, buildTailorPrompt } from "@/lib/prompts";
import { generateJSON, LLMProviderError } from "@/lib/llm/client";
import {
  DEFAULT_LLM_SETTINGS,
  normalizeResume,
  type JobDetails,
  type LLMSettings,
  type Resume,
  type TailorResult,
} from "@/lib/resume-schema";
import {
  DEFAULT_GENERATION_STYLE,
  type GenerationStyle,
} from "@/lib/writing-tone";
import { normalizePrintableText } from "@/lib/text-normalize";
import { validatePrimaryProviderKey } from "@/lib/llm/validate-settings";
import { applyRewriteLocks } from "@/lib/rewrite-locks";

/** Allow longer LLM tailor runs on platforms that support route maxDuration (e.g. Vercel). */
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      resume,
      jobDetails,
      generationStyle,
      settings,
      rewriteLocks,
      mode,
    } = body as {
      resume: Resume;
      jobDetails: JobDetails;
      generationStyle?: Partial<GenerationStyle>;
      settings?: Partial<LLMSettings>;
      rewriteLocks?: string[];
      mode?: "tailor" | "coverLetterOnly";
    };

    if (!resume || !jobDetails) {
      return NextResponse.json(
        { error: "Resume and job details are required" },
        { status: 400 }
      );
    }

    if (!jobDetails.company || !jobDetails.role || !jobDetails.jobDescription) {
      return NextResponse.json(
        { error: "Company, role, and job description are required" },
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

    const source = normalizeResume(resume);
    const coverOnly = mode === "coverLetterOnly";

    if (coverOnly) {
      const prompt = buildCoverLetterOnlyPrompt(source, jobDetails, style);
      const llm = await generateJSON(prompt, llmSettings);
      const parsed = JSON.parse(llm.text) as { coverLetter?: unknown };

      return NextResponse.json({
        resume: source,
        coverLetter: normalizePrintableText(
          Array.isArray(parsed.coverLetter)
            ? parsed.coverLetter
            : (parsed.coverLetter ?? "")
        ),
        changes: [],
        meta: {
          provider: llm.provider,
          totalDurationMs: llm.totalDurationMs,
          attempts: llm.attempts,
        },
      });
    }

    const locks = Array.isArray(rewriteLocks) ? rewriteLocks : [];
    const prompt = buildTailorPrompt(source, jobDetails, style, locks);
    const llm = await generateJSON(prompt, llmSettings);
    const parsed = JSON.parse(llm.text) as TailorResult;

    const tailored = applyRewriteLocks(
      source,
      normalizeResume(parsed.resume ?? {}),
      locks
    );

    const result: TailorResult = {
      resume: tailored,
      coverLetter: normalizePrintableText(
        Array.isArray(parsed.coverLetter)
          ? parsed.coverLetter
          : (parsed.coverLetter ?? "")
      ),
      changes: Array.isArray(parsed.changes)
        ? parsed.changes.map((change) => ({
            section: String(change?.section ?? ""),
            field: String(change?.field ?? ""),
            before: normalizePrintableText(change?.before ?? ""),
            after: normalizePrintableText(change?.after ?? ""),
          }))
        : [],
    };

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
      error instanceof Error ? error.message : "Failed to tailor resume";
    const attempts =
      error instanceof LLMProviderError ? error.attempts : undefined;
    return NextResponse.json(
      { error: message, meta: { attempts } },
      { status: 500 }
    );
  }
}
