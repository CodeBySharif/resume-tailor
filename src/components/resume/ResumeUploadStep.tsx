"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileUp, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

/**
 * Upload shows a snapshot immediately. AI parsing (needed for editable structure)
 * runs when the user clicks Continue — not while "uploading" the file.
 * If a session master resume exists, Continue is enabled and the snapshot reuses it.
 */
export function ResumeUploadStep({
  title = "Choose Resume Source",
  description = "Upload a resume PDF, then continue",
  showBack = false,
  onBack,
  clearAtsOnUpload = false,
  allowTemplate = true,
}: ResumeUploadStepProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [attemptLog, setAttemptLog] = useState<LLMAttempt[] | null>(null);
  const [templateReady, setTemplateReady] = useState(false);
  const [parsedOk, setParsedOk] = useState(false);

  const {
    smoothPercent,
    status,
    setStatus,
    startCreep,
    complete,
    reset,
  } = useSmoothProgress();

  const {
    resume,
    masterResume,
    masterResumeFile,
    setResume,
    setOriginalResume,
    setMasterResume,
    clearAtsResult,
    nextStep,
    llmSettings,
    setError,
  } = useResumeStore();

  const previewFile = selectedFile ?? masterResumeFile;
  const hasMaster = Boolean(masterResume);
  const hasFileOrTemplate = Boolean(selectedFile) || templateReady || parsedOk;
  const storeHasResume = Boolean(
    resume.header.name.trim() ||
      resume.summary.trim() ||
      resume.experience.length
  );
  const canContinue = hasFileOrTemplate || storeHasResume || hasMaster;
  const uploadLabel =
    previewFile || hasMaster || storeHasResume
      ? "Replace resume PDF"
      : "Upload resume PDF";

  function handleFileSelect(file: File) {
    setLocalError(null);
    setError(null);
    setAttemptLog(null);
    setTemplateReady(false);
    setParsedOk(false);
    setSelectedFile(file);
  }

  function handleTemplate() {
    if (clearAtsOnUpload) clearAtsResult();
    const template = createTemplateResume();
    setResume(template);
    setOriginalResume(template);
    setSelectedFile(null);
    setTemplateReady(true);
    setParsedOk(true);
    setLocalError(null);
  }

  async function parseSelectedFile(file: File) {
    const keyError = validatePrimaryProviderKey(llmSettings);
    if (keyError) {
      setLocalError(keyError);
      setError(keyError);
      return false;
    }

    if (clearAtsOnUpload) clearAtsResult();
    setParsing(true);
    setLocalError(null);
    setError(null);
    setAttemptLog(null);
    reset();
    setStatus("Reading PDF…");
    startCreep(0, 22, PDF_READ_DURATION_MS);

    const start = Date.now();
    const elapsedTimer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("settings", JSON.stringify(llmSettings));

      setStatus("Parsing resume with AI…");
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
      if (!data.resume) throw new Error("Failed to parse resume");

      setStatus("Finishing up…");
      await complete();
      setResume(data.resume);
      setOriginalResume(data.resume);
      setMasterResume(data.resume, file);
      setParsedOk(true);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setLocalError(msg);
      reset();
      return false;
    } finally {
      clearInterval(elapsedTimer);
      setElapsedSec(0);
      setParsing(false);
    }
  }

  async function handleContinue() {
    if (parsing) return;

    if (templateReady || parsedOk || (storeHasResume && !selectedFile) || (hasMaster && !selectedFile)) {
      nextStep();
      return;
    }

    if (!selectedFile) return;

    const ok = await parseSelectedFile(selectedFile);
    if (ok) nextStep();
  }

  const readyName =
    resume.header.name.trim() || masterResume?.header.name.trim() || "";

  return (
    <StepShell
      title={title}
      description={description}
      actions={
        <>
          {showBack && onBack ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              disabled={parsing}
            >
              <ChevronLeft className="size-4" />
              Back
            </Button>
          ) : null}
          <Button
            size="sm"
            disabled={!canContinue || parsing}
            onClick={() => void handleContinue()}
            className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            {parsing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            {parsing ? "Parsing…" : "Continue"}
          </Button>
        </>
      }
    >
      {!hasConfiguredApiKey(llmSettings) && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          Add your API key in <strong>Settings</strong> before continuing.
          Parsing uses AI to turn the PDF into editable sections.
        </div>
      )}

      <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
        <PdfPagePreview file={previewFile} size="sm" />

        {parsing && (
          <div className="w-full">
            <OperationProgress
              value={smoothPercent}
              label="Parse progress"
              status={status}
              hint={getLiveProviderHint(llmSettings.provider, elapsedSec)}
              elapsedSec={elapsedSec}
            />
            {attemptLog && attemptLog.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {formatAttemptLog(attemptLog)}
              </p>
            )}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = "";
          }}
        />

        <Button
          className="w-full bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
          disabled={parsing}
          onClick={() => fileRef.current?.click()}
        >
          <FileUp className="size-4" />
          {uploadLabel}
        </Button>

        {allowTemplate && (
          <Button
            variant="outline"
            className="w-full"
            disabled={parsing}
            onClick={handleTemplate}
          >
            <FileText className="size-4" />
            Use template
          </Button>
        )}

        {!parsing && readyName && (
          <p className="text-center text-sm text-muted-foreground">
            {hasMaster && !selectedFile && !parsedOk ? "Using session resume: " : "Ready: "}
            <span className="font-medium text-foreground">{readyName}</span>
          </p>
        )}
      </div>

      {localError && (
        <div className="mx-auto mt-4 max-w-sm space-y-2">
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
