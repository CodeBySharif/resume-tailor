"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OperationProgress } from "@/components/ui/operation-progress";
import { DocumentSkeleton } from "@/components/ui/document-skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StepChoice, StepShell } from "@/components/wizard/StepShell";
import { TonePicker } from "./TonePicker";
import {
  formatAttemptLog,
  getLiveProviderHint,
  getProviderLabel,
} from "@/lib/llm/format-meta";
import { getTailorDurationMs } from "@/lib/llm/progress-estimates";
import type { LLMAttempt } from "@/lib/llm/types";
import { getToneLabel } from "@/lib/writing-tone";
import { validatePrimaryProviderKey } from "@/lib/llm/validate-settings";
import { readJsonResponse } from "@/lib/api-response";
import type { Resume, ResumeChange } from "@/lib/resume-schema";
import { useTimedOperationProgress } from "@/hooks/useTimedOperationProgress";
import { useResumeStore } from "@/store/resume-store";
import { AiContentDisclaimer } from "@/components/ui/ai-content-disclaimer";
import {
  BulletLockPanel,
  collectAllRewriteLocks,
} from "@/components/resume/BulletLockPanel";

const PHASE_LABELS = [
  "Tailoring resume…",
  "Rewriting experience bullets…",
  "Writing cover letter…",
  "Finalizing documents…",
];

export function GenerateStep() {
  const genIdRef = useRef(0);
  const phaseTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedStartRef = useRef(0);

  const [started, setStarted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [providerUsed, setProviderUsed] = useState<string | null>(null);
  const [attemptLog, setAttemptLog] = useState<LLMAttempt[] | null>(null);
  const [error, setLocalError] = useState<string | null>(null);

  const {
    resume,
    jobDetails,
    generationStyle,
    llmSettings,
    rewriteLocks,
    setLoading,
    setError,
    setTailoredResume,
    setCoverLetter,
    setCoverLetterMode,
    setChanges,
    setOriginalResume,
    updateGenerationStyle,
    toggleRewriteLock,
    setRewriteLocks,
    clearRewriteLocks,
    prevStep,
    nextStep,
  } = useResumeStore();

  const durationMs = getTailorDurationMs(llmSettings.provider);
  const { value: progress, status, setStatus, start, finish, reset } =
    useTimedOperationProgress(durationMs);

  function clearPhaseTimer() {
    if (phaseTimer.current) {
      clearInterval(phaseTimer.current);
      phaseTimer.current = null;
    }
  }

  function startPhaseRotation() {
    clearPhaseTimer();
    let phaseIndex = 0;
    setStatus(PHASE_LABELS[0]);
    phaseTimer.current = setInterval(() => {
      phaseIndex = (phaseIndex + 1) % PHASE_LABELS.length;
      setStatus(PHASE_LABELS[phaseIndex]);
    }, 3500);
  }

  useEffect(() => {
    if (!generating) return;

    elapsedStartRef.current = Date.now();
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - elapsedStartRef.current) / 1000));
    }, 1000);

    return () => clearInterval(id);
  }, [generating]);

  async function generate() {
    const genId = ++genIdRef.current;

    const keyError = validatePrimaryProviderKey(llmSettings);
    if (keyError) {
      setLocalError(keyError);
      setError(keyError);
      return;
    }

    setStarted(true);
    setGenerating(true);
    setLoading(true);
    setLocalError(null);
    setError(null);
    setProviderUsed(null);
    setAttemptLog(null);
    setElapsedSec(0);
    reset();
    start();
    setStatus("Starting generation…");
    startPhaseRotation();

    try {
      setOriginalResume(resume);

      const response = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume,
          jobDetails,
          generationStyle,
          settings: llmSettings,
          rewriteLocks,
        }),
      });

      if (genId !== genIdRef.current) return;

      const data = await readJsonResponse<{
        resume?: Resume;
        coverLetter?: string;
        changes?: ResumeChange[];
        error?: string;
        meta?: { provider?: string; attempts?: LLMAttempt[] };
      }>(response);
      if (!response.ok) {
        if (data.meta?.attempts) setAttemptLog(data.meta.attempts);
        throw new Error(data.error || "Generation failed");
      }

      clearPhaseTimer();
      setStatus("Finishing up…");
      await finish();

      if (genId !== genIdRef.current) return;

      if (data.meta?.provider) setProviderUsed(data.meta.provider);
      if (data.meta?.attempts) setAttemptLog(data.meta.attempts);

      if (!data.resume) {
        throw new Error("Generation failed: missing tailored resume");
      }

      setTailoredResume(data.resume);
      setCoverLetter(data.coverLetter ?? "");
      setCoverLetterMode("templated");
      setChanges(data.changes ?? []);
      setGenerating(false);
      setLoading(false);
      nextStep();
    } catch (err) {
      if (genId !== genIdRef.current) return;
      clearPhaseTimer();
      reset();
      const msg = err instanceof Error ? err.message : "Generation failed";
      setLocalError(msg);
      setError(msg);
      setGenerating(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    return () => {
      genIdRef.current += 1;
      clearPhaseTimer();
    };
  }, []);

  const liveHint = generating
    ? getLiveProviderHint(llmSettings.provider, elapsedSec)
    : "";

  if (!started) {
    return (
      <StepShell
        title="Choose Your Writing Voice"
        description={`Pick how your resume and cover letter should sound for ${jobDetails.role} at ${jobDetails.company}`}
        actions={
          <Button variant="outline" size="sm" onClick={prevStep}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
        }
      >
        <StepChoice
          title="Writing style"
          description={
            "Each voice changes wording and emphasis — not layout. Choose “Don't rewrite” on the resume to keep your original wording (with only light ATS keyword alignment). Metrics-Driven adds conservative draft numbers you can adjust in review."
          }
        >
          <div className="space-y-6">
            <AiContentDisclaimer />

            <TonePicker
              label="Resume voice"
              description="How experience bullets and summary are written"
              value={generationStyle.resumeTone}
              onChange={(resumeTone) => updateGenerationStyle({ resumeTone })}
              exampleType="resume"
            />

            <Separator />

            <TonePicker
              label="Cover letter voice"
              description="How your cover letter paragraphs read"
              value={generationStyle.coverLetterTone}
              onChange={(coverLetterTone) =>
                updateGenerationStyle({ coverLetterTone })
              }
              exampleType="coverLetter"
            />

            <BulletLockPanel
              resume={resume}
              locks={rewriteLocks}
              onToggle={toggleRewriteLock}
              onLockAll={() => setRewriteLocks(collectAllRewriteLocks(resume))}
              onUnlockAll={clearRewriteLocks}
            />

            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background px-4 py-3 text-sm">
              <span className="text-muted-foreground">Selected:</span>
              <Badge variant="secondary">
                Resume — {getToneLabel(generationStyle.resumeTone)}
              </Badge>
              <Badge variant="secondary">
                Cover letter — {getToneLabel(generationStyle.coverLetterTone)}
              </Badge>
              {rewriteLocks.length > 0 && (
                <Badge variant="outline">
                  {rewriteLocks.length} locked
                </Badge>
              )}
            </div>

            <Button
              size="lg"
              className="w-full bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90 sm:w-auto"
              onClick={() => void generate()}
            >
              Generate Resume & Cover Letter
            </Button>
          </div>
        </StepChoice>
      </StepShell>
    );
  }

  return (
    <StepShell
      title="Generating…"
      description={`${getToneLabel(generationStyle.resumeTone)} resume · ${getToneLabel(generationStyle.coverLetterTone)} cover letter`}
      actions={
        <Button variant="outline" size="sm" onClick={prevStep} disabled={generating}>
          <ChevronLeft className="size-4" />
          Back
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {generating ? (
              <Loader2 className="size-5 animate-spin text-brand-accent" />
            ) : error ? (
              <AlertCircle className="size-5 text-destructive" />
            ) : (
              <CheckCircle2 className="size-5 text-green-600" />
            )}
            {generating ? "Generating…" : error ? "Generation Failed" : "Complete"}
          </CardTitle>
          <CardDescription>
            Primary:{" "}
            <Badge variant="secondary">
              {getProviderLabel(llmSettings.provider, llmSettings.openrouterModel)}
            </Badge>
            {providerUsed && (
              <>
                {" "}
                · Used{" "}
                <Badge variant="outline" className="text-green-700">
                  {providerUsed}
                </Badge>
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {generating && (
            <>
              <OperationProgress
                value={progress}
                label="Generation progress"
                status={status}
                hint={liveHint}
                elapsedSec={elapsedSec}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <DocumentSkeleton variant="resume" />
                <DocumentSkeleton variant="cover" />
              </div>
            </>
          )}

          {error && (
            <div className="space-y-4">
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
              {attemptLog && attemptLog.length > 0 && (
                <p className="rounded-lg border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Provider attempts:{" "}
                  </span>
                  {formatAttemptLog(attemptLog)}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => void generate()}
                  className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
                >
                  Retry
                </Button>
                <Button variant="outline" onClick={() => setStarted(false)}>
                  Change voice
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </StepShell>
  );
}
