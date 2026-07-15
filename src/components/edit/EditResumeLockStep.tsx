"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepChoice, StepShell } from "@/components/wizard/StepShell";
import {
  BulletLockPanel,
  collectAllRewriteLocks,
} from "@/components/resume/BulletLockPanel";
import { isPreserveTone } from "@/lib/writing-tone";
import { useResumeStore } from "@/store/resume-store";

/** Edit resume step 3 — lock bullets before rewrite. */
export function EditResumeLockStep() {
  const {
    resume,
    generationStyle,
    rewriteLocks,
    toggleRewriteLock,
    setRewriteLocks,
    clearRewriteLocks,
    prevStep,
    nextStep,
  } = useResumeStore();

  const preserve = isPreserveTone(generationStyle.resumeTone);

  return (
    <StepShell
      title="Lock Points to Keep"
      description={
        preserve
          ? "Don't rewrite is selected — you can skip this and continue"
          : "Lock any summary or bullets that must stay exactly as written"
      }
      actions={
        <>
          <Button variant="outline" size="sm" onClick={prevStep}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button
            size="sm"
            onClick={nextStep}
            className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            Continue
            <ChevronRight className="size-4" />
          </Button>
        </>
      }
    >
      {preserve ? (
        <StepChoice
          compact
          title="No rewrite needed"
          description="Your original wording will be kept. Continue to skip generation."
        >
          <p className="text-sm text-muted-foreground">
            Locked bullets are only used when rewriting with AI.
          </p>
        </StepChoice>
      ) : (
        <BulletLockPanel
          resume={resume}
          locks={rewriteLocks}
          onToggle={toggleRewriteLock}
          onLockAll={() => setRewriteLocks(collectAllRewriteLocks(resume))}
          onUnlockAll={clearRewriteLocks}
        />
      )}
    </StepShell>
  );
}
