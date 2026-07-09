"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { fetchGeneralAtsCheck } from "@/lib/ats-client";
import { ATS_CATEGORY_DEFINITIONS } from "@/lib/ats-types";
import { getLiveProviderHint } from "@/lib/llm/format-meta";
import { getAtsCheckDurationMs } from "@/lib/llm/progress-estimates";
import { validatePrimaryProviderKey } from "@/lib/llm/validate-settings";
import { Button } from "@/components/ui/button";
import { DocumentSkeleton } from "@/components/ui/document-skeleton";
import { OperationProgress } from "@/components/ui/operation-progress";
import { AtsScorePanel } from "@/components/review/AtsScorePanel";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { StepShell } from "@/components/wizard/StepShell";
import { useTimedOperationProgress } from "@/hooks/useTimedOperationProgress";
import { useResumeStore } from "@/store/resume-store";

const ATS_CHECK_STATUS_MESSAGES = [
  "Reading resume structure…",
  "Checking formatting and parseability…",
  "Scoring keywords and skills…",
  "Reviewing action verbs and bullets…",
  "Evaluating quantified impact…",
  "Building recommendations…",
];

export function AtsScoreStep() {
  const [localError, setLocalError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const elapsedStartRef = useRef(0);

  const {
    resume,
    llmSettings,
    atsResult,
    atsChecking,
    setAtsChecking,
    setAtsResult,
    setAtsError,
    prevStep,
    nextStep,
  } = useResumeStore();

  const durationMs = getAtsCheckDurationMs(llmSettings.provider);
  const { value: progress, status, setStatus, start, finish, reset } =
    useTimedOperationProgress(durationMs);

  useEffect(() => {
    if (!atsChecking) return;
    elapsedStartRef.current = Date.now();
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - elapsedStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [atsChecking]);

  useEffect(() => {
    if (!atsChecking) return;
    let index = 0;
    setStatus(ATS_CHECK_STATUS_MESSAGES[0]);
    const id = setInterval(() => {
      index = (index + 1) % ATS_CHECK_STATUS_MESSAGES.length;
      setStatus(ATS_CHECK_STATUS_MESSAGES[index]);
    }, 4500);
    return () => clearInterval(id);
  }, [atsChecking, setStatus]);

  async function runCheck() {
    const keyError = validatePrimaryProviderKey(llmSettings);
    if (keyError) {
      setLocalError(keyError);
      setAtsError(keyError);
      return;
    }

    setLocalError(null);
    setAtsError(null);
    setElapsedSec(0);
    setAtsChecking(true);
    start();

    try {
      const result = await fetchGeneralAtsCheck(resume, llmSettings);
      await finish();
      setAtsResult(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "ATS check failed";
      setLocalError(msg);
      setAtsError(msg);
      reset();
    } finally {
      setAtsChecking(false);
    }
  }

  const bulletCount = resume.experience.reduce(
    (n, exp) => n + exp.bullets.filter((b) => b.trim()).length,
    0
  );

  return (
    <StepShell
      title="ATS Score"
      description="Review your resume, then run a general ATS analysis"
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={prevStep}
            disabled={atsChecking}
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button
            size="sm"
            disabled={!atsResult || atsChecking}
            onClick={nextStep}
            className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            Continue
            <ChevronRight className="size-4" />
          </Button>
        </>
      }
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)]">
        <div className="min-w-0 space-y-4">
          {!atsResult && !atsChecking && (
            <>
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-sm font-medium">Your resume</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {resume.header.name || "Unnamed"}
                  {resume.header.title ? ` · ${resume.header.title}` : ""}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {bulletCount} experience bullets · {resume.skills.length}{" "}
                  skills · {resume.projects.length} projects
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">What we&apos;ll analyze</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll score your resume across{" "}
                  {ATS_CATEGORY_DEFINITIONS.length} ATS categories and return
                  specific fixes — no job description needed.
                </p>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {ATS_CATEGORY_DEFINITIONS.map((category) => (
                    <li
                      key={category.id}
                      className="rounded-md border border-border/80 bg-background px-2.5 py-1.5 text-xs text-muted-foreground"
                    >
                      {category.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  size="lg"
                  className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
                  onClick={() => void runCheck()}
                >
                  Run ATS Check
                </Button>
                <p className="text-xs text-muted-foreground">
                  Uses 1 API request
                </p>
              </div>
            </>
          )}

          {atsChecking && !atsResult && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Loader2 className="size-4 animate-spin text-brand-accent" />
                Analyzing your resume…
              </div>
              <OperationProgress
                value={progress}
                label="ATS check progress"
                status={status}
                hint={getLiveProviderHint(llmSettings.provider, elapsedSec)}
                elapsedSec={elapsedSec}
              />
              <DocumentSkeleton variant="resume" />
            </div>
          )}

          {localError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {localError}
            </p>
          )}

          {atsResult && (
            <AtsScorePanel resume={resume} general showRecheck />
          )}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Resume preview
          </p>
          <ResumePreview
            resume={resume}
            className="max-h-[min(70vh,720px)] overflow-y-auto text-[9pt] p-6"
          />
        </aside>
      </div>
    </StepShell>
  );
}
