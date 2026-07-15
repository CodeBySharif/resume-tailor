"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { fetchResumeEnhance } from "@/lib/resume-client";
import { validatePrimaryProviderKey } from "@/lib/llm/validate-settings";
import { getLiveProviderHint } from "@/lib/llm/format-meta";
import { getTailorDurationMs } from "@/lib/llm/progress-estimates";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OperationProgress } from "@/components/ui/operation-progress";
import { DocumentSkeleton } from "@/components/ui/document-skeleton";
import { ResumeVoicePanel } from "@/components/generate/ResumeVoicePanel";
import { StepChoice, StepShell } from "@/components/wizard/StepShell";
import { useTimedOperationProgress } from "@/hooks/useTimedOperationProgress";
import { isPreserveTone } from "@/lib/writing-tone";
import { useResumeStore } from "@/store/resume-store";

export function CreateGenerateStep() {
  const [generating, setGenerating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const genIdRef = useRef(0);
  const elapsedStartRef = useRef(0);

  const {
    resume,
    resumeSuggestions,
    generationStyle,
    llmSettings,
    prevStep,
    nextStep,
    setCreatedResume,
    setError,
  } = useResumeStore();

  const durationMs = getTailorDurationMs(llmSettings.provider);
  const { value: progress, status, setStatus, start, finish, reset } =
    useTimedOperationProgress(durationMs);

  const preserve = isPreserveTone(generationStyle.resumeTone);

  useEffect(() => {
    if (!generating) return;
    elapsedStartRef.current = Date.now();
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - elapsedStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [generating]);

  function continueWithoutRewrite() {
    setCreatedResume(resume);
    nextStep();
  }

  async function runEnhance(mode: "enhance" | "polish") {
    if (!resumeSuggestions) return;

    const keyError = validatePrimaryProviderKey(llmSettings);
    if (keyError) {
      setLocalError(keyError);
      setError(keyError);
      return;
    }

    const genId = ++genIdRef.current;
    setGenerating(true);
    setLocalError(null);
    setError(null);
    setElapsedSec(0);
    reset();
    start();
    setStatus(mode === "enhance" ? "Rewriting resume…" : "Light rewrite…");

    try {
      const result = await fetchResumeEnhance(
        resume,
        resumeSuggestions,
        generationStyle,
        mode,
        llmSettings
      );

      if (genId !== genIdRef.current) return;

      setStatus("Finishing up…");
      await finish();
      setCreatedResume(result);
      nextStep();
    } catch (err) {
      if (genId !== genIdRef.current) return;
      reset();
      const msg = err instanceof Error ? err.message : "Generation failed";
      setLocalError(msg);
      setError(msg);
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    return () => {
      genIdRef.current += 1;
    };
  }, []);

  if (!resumeSuggestions) {
    return (
      <p className="text-muted-foreground">
        No suggestions available. Go back and run the analysis first.
      </p>
    );
  }

  return (
    <StepShell
      title="Generate Resume"
      description="Choose your writing voice — or skip rewrite and go straight to download"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={prevStep}
          disabled={generating}
        >
          <ChevronLeft className="size-4" />
          Back
        </Button>
      }
    >
      {generating ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Loader2 className="size-4 animate-spin" />
              Rewriting resume…
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <OperationProgress
              value={progress}
              label="Rewrite progress"
              status={status}
              hint={getLiveProviderHint(llmSettings.provider, elapsedSec)}
              elapsedSec={elapsedSec}
            />
            <DocumentSkeleton variant="resume" />
          </CardContent>
        </Card>
      ) : (
        <StepChoice
          title="Writing voice & rewrite"
          description="Don't rewrite keeps your draft as written and opens the PDF review immediately."
        >
          <ResumeVoicePanel />

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {preserve ? (
              <Button
                size="lg"
                className="flex-1 bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
                onClick={continueWithoutRewrite}
              >
                Continue to PDF
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="flex-1 bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
                  onClick={() => void runEnhance("enhance")}
                >
                  Rewrite with AI
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1"
                  onClick={() => void runEnhance("polish")}
                >
                  Light rewrite
                </Button>
              </>
            )}
          </div>
          {!preserve && (
            <p className="mt-2 text-xs text-muted-foreground">
              Uses 1 API request
            </p>
          )}

          {localError && (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {localError}
            </p>
          )}
        </StepChoice>
      )}
    </StepShell>
  );
}
