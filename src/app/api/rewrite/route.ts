import { NextRequest, NextResponse } from "next/server";
import {
  buildRewriteCoverPrompt,
  buildRewriteResumePrompt,
} from "@/lib/prompts";
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
import { normalizePrintableText } from "@/lib/text-normalize";
import { applyRewriteLocks } from "@/lib/rewrite-locks";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      type,
      resume,
      coverLetter,
      generationStyle,
      settings,
      rewriteLocks,
    } = body as {
      type: "resume" | "cover";
      resume?: Resume;
      coverLetter?: string;
      generationStyle?: Partial<GenerationStyle>;
      settings?: Partial<LLMSettings>;
      rewriteLocks?: string[];
    };

    if (type !== "resume" && type !== "cover") {
      return NextResponse.json({ error: "type must be resume or cover" }, { status: 400 });
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

    if (type === "resume") {
      if (!resume) {
        return NextResponse.json({ error: "Resume is required" }, { status: 400 });
      }
      const locks = Array.isArray(rewriteLocks) ? rewriteLocks : [];
      const source = normalizeResume(resume);
      const prompt = buildRewriteResumePrompt(source, style, locks);
      const llm = await generateJSON(prompt, llmSettings);
      const parsed = JSON.parse(llm.text) as { resume?: Resume };
      if (!parsed.resume) {
        return NextResponse.json({ error: "Rewrite failed" }, { status: 500 });
      }
      return NextResponse.json({
        resume: applyRewriteLocks(source, normalizeResume(parsed.resume), locks),
        meta: {
          provider: llm.provider,
          totalDurationMs: llm.totalDurationMs,
          attempts: llm.attempts,
        },
      });
    }

    const letter = typeof coverLetter === "string" ? coverLetter.trim() : "";
    if (!letter) {
      return NextResponse.json(
        { error: "Cover letter text is required" },
        { status: 400 }
      );
    }

    const prompt = buildRewriteCoverPrompt(letter, style);
    const llm = await generateJSON(prompt, llmSettings);
    const parsed = JSON.parse(llm.text) as { coverLetter?: string };
    if (!parsed.coverLetter?.trim()) {
      return NextResponse.json({ error: "Rewrite failed" }, { status: 500 });
    }

    return NextResponse.json({
      coverLetter: normalizePrintableText(parsed.coverLetter),
      meta: {
        provider: llm.provider,
        totalDurationMs: llm.totalDurationMs,
        attempts: llm.attempts,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to rewrite document";
    const attempts =
      error instanceof LLMProviderError ? error.attempts : undefined;
    return NextResponse.json(
      { error: message, meta: { attempts } },
      { status: 500 }
    );
  }
}
