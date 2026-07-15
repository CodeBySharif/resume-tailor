import { NextRequest, NextResponse } from "next/server";
import { buildParseResumePrompt } from "@/lib/prompts";
import { generateJSON, LLMProviderError } from "@/lib/llm/client";
import {
  DEFAULT_LLM_SETTINGS,
  normalizeResume,
  type LLMSettings,
} from "@/lib/resume-schema";
import { extractJsonObject } from "@/lib/resume-parse-sanitize";
import { validatePrimaryProviderKey } from "@/lib/llm/validate-settings";
import { extractTextFromPdfBuffer } from "@/lib/pdf-extract-server";

export const maxDuration = 120;
export const runtime = "nodejs";

async function parseSettingsField(raw: unknown): Promise<Partial<LLMSettings>> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Partial<LLMSettings>;
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") {
    return raw as Partial<LLMSettings>;
  }
  return {};
}

async function getTextAndSettings(request: NextRequest): Promise<{
  text: string;
  settings: Partial<LLMSettings>;
}> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    const settings = await parseSettingsField(form.get("settings"));

    if (!(file instanceof Blob)) {
      throw new Error("PDF file is required");
    }
    const fileName =
      file instanceof File && file.name ? file.name : "resume.pdf";
    if (
      file.type &&
      !file.type.includes("pdf") &&
      !fileName.toLowerCase().endsWith(".pdf")
    ) {
      throw new Error("Please upload a PDF file");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const text = await extractTextFromPdfBuffer(bytes);
    return { text, settings };
  }

  const body = await request.json();
  const { text, pdfBase64, settings } = body as {
    text?: string;
    pdfBase64?: string;
    settings?: Partial<LLMSettings>;
  };

  if (typeof text === "string" && text.trim()) {
    return { text, settings: settings ?? {} };
  }

  if (typeof pdfBase64 === "string" && pdfBase64.trim()) {
    const base64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
    const bytes = new Uint8Array(Buffer.from(base64, "base64"));
    const extracted = await extractTextFromPdfBuffer(bytes);
    return { text: extracted, settings: settings ?? {} };
  }

  throw new Error("Resume PDF or text is required");
}

export async function POST(request: NextRequest) {
  try {
    const { text, settings } = await getTextAndSettings(request);

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
    const parsed = extractJsonObject(llm.text) as Partial<
      import("@/lib/resume-schema").Resume
    >;
    const resume = normalizeResume(parsed, { sanitizeArtifacts: true });

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
