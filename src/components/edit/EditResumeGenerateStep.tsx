"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepChoice, StepShell } from "@/components/wizard/StepShell";
import { OperationProgress } from "@/components/ui/operation-progress";
import { readJsonResponse } from "@/lib/api-response";
import { formatAttemptLog, getLiveProviderHint } from "@/lib/llm/format-meta";
import { validatePrimaryProviderKey } from "@/lib/llm/validate-settings";
import type { LLMAttempt } from "@/lib/llm/types";
import type { Resume } from "@/lib/resume-schema";
import { getToneLabel, isPreserveTone } from "@/lib/writing-tone";
import { useTimedOperationProgress } from "@/hooks/useTimedOperationProgress";
import { useResumeStore } from "@/store/resume-store";

/** Edit resume step 4 — rewrite (or skip) then continue to edit. */
export function EditResumeGenerateStep() {
  const [rewriting, setRewriting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [attemptLog, setAttemptLog] = useState<LLMAttempt[] | null>(null);

  const {
    resume,
    generationStyle,
    llmSettings,
    rewriteLocks,
    setResume,
    setOriginalResume,
    prevStep,
    nextStep,
    setError,
  } = useResumeStore();

  const { value, status, setStatus, start, finish, reset } =
    useTimedOperationProgress(45000);

  const preserve = isPreserveTone(generationStyle.resumeTone);

  async function handleContinue() {
    if (preserve) {
      nextStep();
      return;
    }

    const keyError = validatePrimaryProviderKey(llmSettings);
    if (keyError) {
      setLocalError(keyError);
      setError(keyError);
      return;
    }

    setRewriting(true);
    setLocalError(null);
    setAttemptLog(null);
    setError(null);
    reset();
    start();
    setStatus("Rewriting resume…");

    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "resume",
          resume,
          generationStyle,
          settings: llmSettings,
          rewriteLocks,
        }),
      });

      const data = await readJsonResponse<{
        resume?: Resume;
        error?: string;
        meta?: { attempts?: LLMAttempt[] };
      }>(response);

      if (!response.ok) {
        if (data.meta?.attempts) setAttemptLog(data.meta.attempts);
        throw new Error(data.error || "Rewrite failed");
      }
      if (!data.resume) throw new Error("Rewrite failed");

      setStatus("Finishing…");
      await finish();
      setOriginalResume(resume);
      setResume(data.resume);
      nextStep();
    } catch (err) {
      reset();
      const msg = err instanceof Error ? err.message : "Rewrite failed";
      setLocalError(msg);
      setError(msg);
    } finally {
      setRewriting(false);
    }
  }

  return (
    <StepShell
      title="Generate"
      description={
        preserve
          ? "Don't rewrite selected — continue straight to edit"
          : `Rewrite unlocked points in ${getToneLabel(generationStyle.resumeTone)} voice`
      }
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={prevStep}
            disabled={rewriting}
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button
            size="sm"
            disabled={rewriting}
            onClick={() => void handleContinue()}
            className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            {rewriting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            {rewriting
              ? "Rewriting…"
              : preserve
                ? "Continue to edit"
                : "Rewrite & continue"}
          </Button>
        </>
      }
    >
      <StepChoice
        compact
        title={preserve ? "Skip rewrite" : "Ready to rewrite"}
        description={
          preserve
            ? "Your resume text stays as uploaded."
            : `${rewriteLocks.length} locked item${rewriteLocks.length === 1 ? "" : "s"} will be preserved.`
        }
      >
        {rewriting && (
          <OperationProgress
            value={value}
            label="Rewrite progress"
            status={status}
            hint={getLiveProviderHint(llmSettings.provider, 0)}
          />
        )}

        {localError && (
          <div className="mt-3 space-y-2">
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
      </StepChoice>
    </StepShell>
  );
}
