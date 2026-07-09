"use client";

import { cn } from "@/lib/utils";
import { StepChoice, StepShell } from "@/components/wizard/StepShell";
import { useResumeStore } from "@/store/resume-store";

export function ModePicker() {
  const { startCreateFlow, startTailorFlow, startAtsFlow } = useResumeStore();

  return (
    <StepShell
      title="What would you like to do?"
      description="Choose a workflow — switch anytime from the header"
    >
      <div className="grid items-stretch gap-4 sm:grid-cols-3">
        <StepChoice
          title="Create Resume"
          description="Build from scratch with ATS-friendly sections, get AI suggestions, then generate or polish your resume."
        >
          <button
            type="button"
            onClick={startCreateFlow}
            className={cn(
              "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium",
              "transition-colors hover:border-brand-accent hover:bg-brand-accent/5"
            )}
          >
            Start creating
          </button>
        </StepChoice>

        <StepChoice
          title="Tailor Resume"
          description="Upload or use a template, edit, add job details, and generate a tailored resume with cover letter."
        >
          <button
            type="button"
            onClick={startTailorFlow}
            className={cn(
              "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium",
              "transition-colors hover:border-brand-accent hover:bg-brand-accent/5"
            )}
          >
            Start tailoring
          </button>
        </StepChoice>

        <StepChoice
          title="ATS Checker"
          description="Upload your PDF, get a general ATS score with suggestions, then generate an improved ATS-friendly resume."
        >
          <button
            type="button"
            onClick={startAtsFlow}
            className={cn(
              "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium",
              "transition-colors hover:border-brand-accent hover:bg-brand-accent/5"
            )}
          >
            Start ATS check
          </button>
        </StepChoice>
      </div>
    </StepShell>
  );
}
