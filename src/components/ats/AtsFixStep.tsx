"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { fetchAtsFix, fetchGeneralAtsCheck } from "@/lib/ats-client";
import { validatePrimaryProviderKey } from "@/lib/llm/validate-settings";
import { formatAttemptLog, getLiveProviderHint } from "@/lib/llm/format-meta";
import { getTailorDurationMs } from "@/lib/llm/progress-estimates";
import type { LLMAttempt } from "@/lib/llm/types";
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
import { useResumeStore } from "@/store/resume-store";
import { AiContentDisclaimer } from "@/components/ui/ai-content-disclaimer";
import {
  BulletLockPanel,
  collectAllRewriteLocks,
} from "@/components/resume/BulletLockPanel";
import { isPreserveTone } from "@/lib/writing-tone";

export function AtsFixStep() {
  const [fixing, setFixing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [attemptLog, setAttemptLog] = useState<LLMAttempt[] | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const fixIdRef = useRef(0);
  const elapsedStartRef = useRef(0);

  const {
    resume,
    atsResult,
    generationStyle,
    llmSettings,
    rewriteLocks,
    prevStep,
    nextStep,
    setFixedResume,
    setFixedAtsResult,
    setFixedAtsChecking,
    clearFixedAtsResult,
    toggleRewriteLock,
    setRewriteLocks,
    clearRewriteLocks,
    setError,
  } = useResumeStore();

  const durationMs = getTailorDurationMs(llmSettings.provider);
  const { value: progress, status, setStatus, start, finish, reset } =
    useTimedOperationProgress(durationMs);

  const issueCount =
    atsResult?.categories.filter(
      (c) => c.status === "fail" || c.status === "warning"
    ).length ?? 0;

  useEffect(() => {
    if (!fixing) return;
    elapsedStartRef.current = Date.now();
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - elapsedStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [fixing]);

  async function runFix() {
    if (!atsResult) return;

    const keyError = validatePrimaryProviderKey(llmSettings);
    if (keyError) {
      setLocalError(keyError);
      setError(keyError);
      return;
    }

    const fixId = ++fixIdRef.current;
    setFixing(true);
    setLocalError(null);
    setError(null);
    setAttemptLog(null);
    setElapsedSec(0);
    clearFixedAtsResult();
    reset();
    start();
    setStatus("Improving resume for ATS…");

    try {
      const fixed = await fetchAtsFix(
        resume,
        atsResult,
        generationStyle,
        llmSettings,
        rewriteLocks
      );

      if (fixId !== fixIdRef.current) return;

      setFixedResume(fixed);
      setStatus("Scoring improved resume…");
      setFixedAtsChecking(true);
      const improvedScore = await fetchGeneralAtsCheck(fixed, llmSettings);

      if (fixId !== fixIdRef.current) return;

      setFixedAtsResult(improvedScore);
      setFixedAtsChecking(false);
      await finish();
      nextStep();
    } catch (err) {
      if (fixId !== fixIdRef.current) return;
      reset();
      const msg = err instanceof Error ? err.message : "Failed to improve resume";
      setLocalError(msg);
      setError(msg);
    } finally {
      setFixing(false);
      setFixedAtsChecking(false);
    }
  }

  useEffect(() => {
    return () => {
      fixIdRef.current += 1;
    };
  }, []);

  if (!atsResult) {
    return (
      <p className="text-muted-foreground">
        No ATS score available. Go back and run the check first.
      </p>
    );
  }

  return (
    <StepShell
      title="Fix Resume"
      description="Choose your writing voice and generate an improved ATS-friendly resume"
      actions={
        <Button variant="outline" size="sm" onClick={prevStep} disabled={fixing}>
          <ChevronLeft className="size-4" />
          Back
        </Button>
      }
    >
      {fixing ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Loader2 className="size-4 animate-spin" />
              Generating ATS-friendly resume
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <OperationProgress
              value={progress}
              label="Generation progress"
              status={status}
              hint={getLiveProviderHint(llmSettings.provider, elapsedSec)}
              elapsedSec={elapsedSec}
            />
            <DocumentSkeleton variant="resume" />
          </CardContent>
        </Card>
      ) : (
        <StepChoice
          title="Ready to improve"
          description={`Your resume scored ${atsResult.overallScore}/100 (${atsResult.grade}).${
            issueCount > 0
              ? ` ${issueCount} categor${issueCount === 1 ? "y" : "ies"} need attention.`
              : " We'll still polish formatting and clarity."
          }`}
        >
          {atsResult.topPriorities.length > 0 && (
            <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
              {atsResult.topPriorities.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          )}

          <AiContentDisclaimer className="mb-4" />

          <ResumeVoicePanel />

          {!isPreserveTone(generationStyle.resumeTone) && (
            <BulletLockPanel
              className="mt-4"
              resume={resume}
              locks={rewriteLocks}
              onToggle={toggleRewriteLock}
              onLockAll={() => setRewriteLocks(collectAllRewriteLocks(resume))}
              onUnlockAll={clearRewriteLocks}
            />
          )}

          <Button
            size="lg"
            className="mt-6 w-full bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90 sm:w-auto"
            onClick={() => void runFix()}
          >
            Generate ATS-friendly resume
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Uses 2 API requests (improve + rescore)
          </p>

          {localError && (
            <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {localError}
            </p>
          )}

          {attemptLog && attemptLog.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {formatAttemptLog(attemptLog)}
            </p>
          )}
        </StepChoice>
      )}
    </StepShell>
  );
}
