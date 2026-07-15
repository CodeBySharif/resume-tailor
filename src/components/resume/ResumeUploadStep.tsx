"use client";

import { useRef, useState } from "react";
import { ChevronLeft, FileUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OperationProgress } from "@/components/ui/operation-progress";
import { PdfPagePreview } from "./PdfPagePreview";
import { StepShell } from "@/components/wizard/StepShell";
import { createTemplateResume } from "@/lib/resume-schema";
import { useSmoothProgress } from "@/hooks/useSmoothProgress";
import {
  formatAttemptLog,
  getLiveProviderHint,
} from "@/lib/llm/format-meta";
import {
  getParseDurationMs,
  PDF_READ_DURATION_MS,
} from "@/lib/llm/progress-estimates";
import type { LLMAttempt } from "@/lib/llm/types";
import {
  hasConfiguredApiKey,
  validatePrimaryProviderKey,
} from "@/lib/llm/validate-settings";
import { readJsonResponse } from "@/lib/api-response";
import type { Resume } from "@/lib/resume-schema";
import { useResumeStore } from "@/store/resume-store";

interface ResumeUploadStepProps {
  title?: string;
  description?: string;
  showBack?: boolean;
  onBack?: () => void;
  clearAtsOnUpload?: boolean;
  allowTemplate?: boolean;
}

export function ResumeUploadStep({
  title = "Choose Resume Source",
  description = "Upload an existing PDF resume or start from a template",
  showBack = false,
  onBack,
  clearAtsOnUpload = false,
  allowTemplate = true,
}: ResumeUploadStepProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [attemptLog, setAttemptLog] = useState<LLMAttempt[] | null>(null);

  const {
    smoothPercent,
    status,
    setStatus,
    startCreep,
    complete,
    reset,
  } = useSmoothProgress();

  const {
    setResume,
    setOriginalResume,
    clearAtsResult,
    nextStep,
    llmSettings,
    setError,
  } = useResumeStore();

  async function handleFileUpload(file: File) {
    const keyError = validatePrimaryProviderKey(llmSettings);
    if (keyError) {
      setLocalError(keyError);
      setError(keyError);
      return;
    }

    setLocalError(null);
    setError(null);
    setAttemptLog(null);
    if (clearAtsOnUpload) clearAtsResult();
    setUploading(true);
    setSelectedFile(file);
    reset();
    setStatus("Uploading PDF…");
    startCreep(0, 22, PDF_READ_DURATION_MS);

    const start = Date.now();
    const elapsedTimer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    try {
      // Parse PDF on the server — avoids Safari/mobile pdf.js crashes.
      const form = new FormData();
      form.append("file", file);
      form.append("settings", JSON.stringify(llmSettings));

      setStatus("Reading PDF & analyzing with AI…");
      startCreep(18, 90, getParseDurationMs(llmSettings.provider));

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: form,
      });

      const data = await readJsonResponse<{
        resume?: Resume;
        error?: string;
        meta?: { attempts?: LLMAttempt[] };
      }>(response);
      if (!response.ok) {
        if (data.meta?.attempts) setAttemptLog(data.meta.attempts);
        throw new Error(data.error || "Failed to parse resume");
      }

      if (data.meta?.attempts) setAttemptLog(data.meta.attempts);

      if (!data.resume) {
        throw new Error("Failed to parse resume");
      }

      setStatus("Finishing up…");
      await complete();

      setResume(data.resume);
      setOriginalResume(data.resume);
      nextStep();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setLocalError(msg);
      reset();
    } finally {
      clearInterval(elapsedTimer);
      setElapsedSec(0);
      setUploading(false);
    }
  }

  function handleTemplate() {
    if (clearAtsOnUpload) clearAtsResult();
    const template = createTemplateResume();
    setResume(template);
    setOriginalResume(template);
    nextStep();
  }

  return (
    <StepShell
      title={title}
      description={description}
      actions={
        showBack && onBack ? (
          <Button variant="outline" size="sm" onClick={onBack} disabled={uploading}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
        ) : undefined
      }
    >
      {!hasConfiguredApiKey(llmSettings) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          Add your API key in <strong>Settings</strong> before uploading a PDF.
          OpenRouter is recommended — free tier, no credit card required.
        </div>
      )}

      {uploading && selectedFile ? (
        <div className="grid gap-6 md:grid-cols-2">
          <PdfPagePreview file={selectedFile} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parsing your resume</CardTitle>
              <CardDescription>{status || "Processing…"}</CardDescription>
            </CardHeader>
            <CardContent>
              <OperationProgress
                value={smoothPercent}
                label="Parsing progress"
                status={status}
                hint={getLiveProviderHint(llmSettings.provider, elapsedSec)}
                elapsedSec={elapsedSec}
              />
              {attemptLog && attemptLog.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {formatAttemptLog(attemptLog)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div
          className={
            allowTemplate
              ? "grid gap-4 sm:grid-cols-2"
              : "max-w-md"
          }
        >
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="size-5" />
                Upload PDF
              </CardTitle>
              <CardDescription>
                Extract and parse your existing resume using AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileUpload(file);
                }}
              />
              <Button
                className="w-full bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                Select PDF file
              </Button>
            </CardContent>
          </Card>

          {allowTemplate && (
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5" />
                Use Template
              </CardTitle>
              <CardDescription>
                Start with a sample resume and customize it
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                disabled={uploading}
                onClick={handleTemplate}
              >
                Start from template
              </Button>
            </CardContent>
          </Card>
          )}
        </div>
      )}

      {localError && (
        <div className="space-y-2">
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {localError}
          </p>
          {attemptLog && attemptLog.length > 0 && (
            <p className="rounded-lg border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
              Provider attempts: {formatAttemptLog(attemptLog)}
            </p>
          )}
        </div>
      )}
    </StepShell>
  );
}
