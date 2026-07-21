"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TonePicker } from "@/components/generate/TonePicker";
import { StepChoice, StepShell } from "@/components/wizard/StepShell";
import { OperationProgress } from "@/components/ui/operation-progress";
import { readJsonResponse } from "@/lib/api-response";
import { formatAttemptLog, getLiveProviderHint } from "@/lib/llm/format-meta";
import { validatePrimaryProviderKey } from "@/lib/llm/validate-settings";
import type { LLMAttempt } from "@/lib/llm/types";
import { isPreserveTone } from "@/lib/writing-tone";
import { useTimedOperationProgress } from "@/hooks/useTimedOperationProgress";
import { useResumeStore } from "@/store/resume-store";
import { AiContentDisclaimer } from "@/components/ui/ai-content-disclaimer";
import { stripCoverLetterSignature } from "@/lib/resume-header";

export function EditCoverToneStep() {
  const [rewriting, setRewriting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [attemptLog, setAttemptLog] = useState<LLMAttempt[] | null>(null);

  const {
    coverLetter,
    generationStyle,
    llmSettings,
    updateGenerationStyle,
    setCoverLetter,
    setCoverLetterMode,
    prevStep,
    nextStep,
    setError,
  } = useResumeStore();

  const { value, status, setStatus, start, finish, reset } =
    useTimedOperationProgress(40000);

  async function handleContinue() {
    setCoverLetterMode("templated");

    if (isPreserveTone(generationStyle.coverLetterTone)) {
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
    setStatus("Rewriting cover letter…");

    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "cover",
          coverLetter,
          generationStyle,
          settings: llmSettings,
        }),
      });

      const data = await readJsonResponse<{
        coverLetter?: string;
        error?: string;
        meta?: { attempts?: LLMAttempt[] };
      }>(response);

      if (!response.ok) {
        if (data.meta?.attempts) setAttemptLog(data.meta.attempts);
        throw new Error(data.error || "Rewrite failed");
      }
      if (!data.coverLetter?.trim()) throw new Error("Rewrite failed");

      setStatus("Finishing…");
      await finish();
      // Keep body-only so the templated canvas / PDF can wrap greeting & sign-off
      setCoverLetter(stripCoverLetterSignature(data.coverLetter));
      setCoverLetterMode("templated");
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
      title="Writing Voice"
      description="Keep the letter as uploaded, or rewrite it in a chosen voice before editing"
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
              : isPreserveTone(generationStyle.coverLetterTone)
                ? "Continue without rewrite"
                : "Rewrite & continue"}
          </Button>
        </>
      }
    >
      <AiContentDisclaimer className="mb-4" />

      <StepChoice
        title="Cover letter voice"
        description={"Choose “Don't rewrite” to edit the letter in format as-is"}
      >
        <TonePicker
          label="How should this letter sound?"
          description="Don't rewrite keeps your uploaded wording in the letter layout"
          value={generationStyle.coverLetterTone}
          onChange={(coverLetterTone) =>
            updateGenerationStyle({ coverLetterTone })
          }
          exampleType="coverLetter"
        />
      </StepChoice>

      {rewriting && (
        <div className="mt-4">
          <OperationProgress
            value={value}
            label="Rewrite progress"
            status={status}
            hint={getLiveProviderHint(llmSettings.provider, 0)}
          />
        </div>
      )}

      {localError && (
        <div className="mt-4 space-y-2">
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
