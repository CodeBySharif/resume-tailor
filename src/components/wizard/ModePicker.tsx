"use client";

import { cn } from "@/lib/utils";
import { StepChoice, StepShell } from "@/components/wizard/StepShell";
import { useResumeStore } from "@/store/resume-store";

export function ModePicker() {
  const {
    startCreateFlow,
    startTailorFlow,
    startAtsFlow,
    startEditResumeFlow,
    startEditCoverFlow,
    startGenerateCvFlow,
  } = useResumeStore();

  const cardBtn = cn(
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-medium",
    "transition-colors hover:border-brand-accent hover:bg-brand-accent/5"
  );

  return (
    <StepShell
      title="What would you like to do?"
      description="Choose a workflow — switch anytime from the header"
    >
      <div className="space-y-5">
        <section className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resume
          </h3>
          <div className="grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StepChoice
              compact
              title="Create Resume"
              description="Build from scratch with ATS-friendly sections."
            >
              <button type="button" onClick={startCreateFlow} className={cardBtn}>
                Start creating
              </button>
            </StepChoice>

            <StepChoice
              compact
              title="Edit Resume"
              description="Upload, optionally rewrite, then edit and download."
            >
              <button
                type="button"
                onClick={startEditResumeFlow}
                className={cardBtn}
              >
                Start editing
              </button>
            </StepChoice>

            <StepChoice
              compact
              title="Tailor Resume"
              description="Match your resume and cover letter to a job."
            >
              <button type="button" onClick={startTailorFlow} className={cardBtn}>
                Start tailoring
              </button>
            </StepChoice>

            <StepChoice
              compact
              title="ATS Checker"
              description="Score your PDF and generate an ATS-friendly version."
            >
              <button type="button" onClick={startAtsFlow} className={cardBtn}>
                Start ATS check
              </button>
            </StepChoice>
          </div>
        </section>

        <section className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Cover Letter
          </h3>
          <div className="grid items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StepChoice
              compact
              title="Generate Cover Letter"
              description="Upload a resume, add the JD, and generate a cover letter."
            >
              <button
                type="button"
                onClick={startGenerateCvFlow}
                className={cardBtn}
              >
                Start generating
              </button>
            </StepChoice>

            <StepChoice
              compact
              title="Edit Cover Letter"
              description="Upload a cover letter PDF or paste text, then edit as-is."
            >
              <button
                type="button"
                onClick={startEditCoverFlow}
                className={cardBtn}
              >
                Start editing
              </button>
            </StepChoice>
          </div>
        </section>
      </div>
    </StepShell>
  );
}
