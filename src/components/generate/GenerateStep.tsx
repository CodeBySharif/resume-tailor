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
import { SmoothProgressBar } from "@/components/ui/smooth-progress-bar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { useResumeStore } from "@/store/resume-store";

const PHASE_LABELS = [
  "Tailoring resume…",
  "Rewriting experience bullets…",
  "Writing cover letter…",
  "Finalizing documents…",
];

function easeOutQuad(t: number): number {
  return t * (2 - t);
}

function animateProgress(
  from: number,
  to: number,
  durationMs: number,
  onUpdate: (value: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const value = from + (to - from) * easeOutQuad(t);
      onUpdate(value);
      if (t >= 1) {
        onUpdate(to);
        resolve();
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

export function GenerateStep() {
  const genIdRef = useRef(0);
  const phaseTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);
  const elapsedStartRef = useRef(0);

  const [started, setStarted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [providerUsed, setProviderUsed] = useState<string | null>(null);
  const [attemptLog, setAttemptLog] = useState<LLMAttempt[] | null>(null);
  const [error, setLocalError] = useState<string | null>(null);

  const {
    resume,
    jobDetails,
    generationStyle,
    llmSettings,
    changes,
    setLoading,
    setError,
    setTailoredResume,
    setCoverLetter,
    setChanges,
    setOriginalResume,
    updateGenerationStyle,
    prevStep,
    nextStep,
  } = useResumeStore();

  const durationMs = getTailorDurationMs(llmSettings.provider);
  const displayPercent = Math.min(100, Math.round(progress));

  function updateProgress(value: number) {
    progressRef.current = value;
    setProgress(value);
  }

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

    const cap = 90;
    const start = performance.now();

    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(1, elapsed / durationMs);
      let value = easeOutQuad(t) * cap;
      if (t >= 1) {
        value = cap;
      }
      updateProgress(value);
    };

    tick();
    const id = setInterval(tick, 80);
    return () => clearInterval(id);
  }, [generating, durationMs]);

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
    updateProgress(0);
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
        }),
      });

      if (genId !== genIdRef.current) return;

      const data = await response.json();
      if (!response.ok) {
        if (data.meta?.attempts) setAttemptLog(data.meta.attempts);
        throw new Error(data.error || "Generation failed");
      }

      clearPhaseTimer();
      setStatus("Finishing up…");
      await animateProgress(progressRef.current, 100, 450, updateProgress);

      if (genId !== genIdRef.current) return;

      if (data.meta?.provider) setProviderUsed(data.meta.provider);
      if (data.meta?.attempts) setAttemptLog(data.meta.attempts);

      setTailoredResume(data.resume);
      setCoverLetter(data.coverLetter);
      setChanges(data.changes ?? []);
      setGenerating(false);
      setLoading(false);
      nextStep();
    } catch (err) {
      if (genId !== genIdRef.current) return;
      clearPhaseTimer();
      updateProgress(0);
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Choose Your Writing Voice</h2>
            <p className="text-sm text-muted-foreground">
              Pick how your resume and cover letter should sound for{" "}
              {jobDetails.role} at {jobDetails.company}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={prevStep}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Writing Style</CardTitle>
            <CardDescription>
              Each voice changes wording and emphasis — not layout. Metrics-Driven
              emphasizes quantified impact and can include draft values that you
              can fine-tune in review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <TonePicker
              label="Resume voice"
              description="How experience bullets and summary are written"
              value={generationStyle.resumeTone}
              onChange={(resumeTone) =>
                updateGenerationStyle({ resumeTone })
              }
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

            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 px-4 py-3 text-sm">
              <span className="text-muted-foreground">Selected:</span>
              <Badge variant="secondary">
                Resume — {getToneLabel(generationStyle.resumeTone)}
              </Badge>
              <Badge variant="secondary">
                Cover letter — {getToneLabel(generationStyle.coverLetterTone)}
              </Badge>
            </div>

            <Button
              size="lg"
              className="w-full bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90 sm:w-auto"
              onClick={() => void generate()}
            >
              Generate Resume & Cover Letter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Generating…</h2>
          <p className="text-sm text-muted-foreground">
            {getToneLabel(generationStyle.resumeTone)} resume ·{" "}
            {getToneLabel(generationStyle.coverLetterTone)} cover letter
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={prevStep} disabled={generating}>
          <ChevronLeft className="size-4" />
          Back
        </Button>
      </div>

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
              {getProviderLabel(
                llmSettings.provider,
                llmSettings.openrouterModel
              )}
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
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Generation progress</span>
                <span className="tabular-nums font-medium text-brand-accent">
                  {displayPercent}%
                </span>
              </div>
              <SmoothProgressBar value={progress} />
              <p className="text-sm font-medium">{status || "Processing…"}</p>
              <p className="text-sm text-muted-foreground">{liveHint}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                Elapsed: {elapsedSec}s
              </p>
            </div>
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

          {attemptLog && attemptLog.length > 0 && !generating && !error && (
            <p className="text-xs text-muted-foreground">
              {formatAttemptLog(attemptLog)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
