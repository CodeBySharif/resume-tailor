"use client";

import { useRef, useState } from "react";
import { FileText, FileUp, Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OperationProgress } from "@/components/ui/operation-progress";
import { PdfPagePreview } from "./PdfPagePreview";
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

/**
 * Session master resume: upload once, reuse in Tailor / ATS / Edit / Cover Letter.
 */
export function ResumeDialog() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
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
    masterResume,
    masterResumeFile,
    setMasterResume,
    clearMasterResume,
    llmSettings,
  } = useResumeStore();

  const hasMaster = Boolean(masterResume);
  const uploadLabel = hasMaster ? "Replace resume PDF" : "Upload resume PDF";

  async function parseAndSave(file: File) {
    const keyError = validatePrimaryProviderKey(llmSettings);
    if (keyError) {
      setLocalError(keyError);
      return;
    }

    setParsing(true);
    setLocalError(null);
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
      if (!data.resume) throw new Error("Failed to parse resume");

      setStatus("Finishing up…");
      await complete();
      setMasterResume(data.resume, file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setLocalError(msg);
      reset();
    } finally {
      clearInterval(elapsedTimer);
      setElapsedSec(0);
      setParsing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          />
        }
      >
        <FileText className="size-4" />
        Resume
      </DialogTrigger>
      <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>Session resume</DialogTitle>
          <DialogDescription>
            Upload once and reuse across Tailor, ATS, Edit Resume, and Generate
            Cover Letter. You can still replace it inside any flow.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-2">
          {!hasConfiguredApiKey(llmSettings) && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              Add your API key in <strong>Settings</strong> before uploading.
            </div>
          )}

          <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
            <PdfPagePreview file={masterResumeFile} size="sm" />

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
                if (file) void parseAndSave(file);
                e.target.value = "";
              }}
            />

            <div className="flex w-full gap-2">
              <Button
                className="flex-1 bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
                disabled={parsing}
                onClick={() => fileRef.current?.click()}
              >
                {parsing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileUp className="size-4" />
                )}
                {parsing ? "Parsing…" : uploadLabel}
              </Button>
              {hasMaster && (
                <Button
                  variant="outline"
                  size="icon"
                  disabled={parsing}
                  aria-label="Clear session resume"
                  onClick={() => {
                    clearMasterResume();
                    setLocalError(null);
                    setAttemptLog(null);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>

            {!parsing && masterResume?.header.name && (
              <p className="text-center text-sm text-muted-foreground">
                Ready:{" "}
                <span className="font-medium text-foreground">
                  {masterResume.header.name}
                </span>
              </p>
            )}

            {localError && (
              <div className="w-full space-y-2">
                <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {localError}
                </p>
                {attemptLog && attemptLog.length > 0 && (
                  <p className="rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    Provider attempts: {formatAttemptLog(attemptLog)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
