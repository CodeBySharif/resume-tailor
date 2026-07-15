"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FreeformCoverEditor } from "@/components/review/FreeformCoverEditor";
import { StepShell } from "@/components/wizard/StepShell";
import { useResumeStore } from "@/store/resume-store";

export function EditCoverEditStep() {
  const { coverLetter, setCoverLetter, setCoverLetterMode, prevStep, nextStep } =
    useResumeStore();

  const canContinue = Boolean(coverLetter.trim());

  return (
    <StepShell
      title="Edit Cover Letter"
      description="Edit the full letter text as it will appear in the PDF — nothing is added around it"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={prevStep}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button
            size="sm"
            disabled={!canContinue}
            onClick={() => {
              setCoverLetterMode("freeform");
              nextStep();
            }}
            className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            Continue
            <ChevronRight className="size-4" />
          </Button>
        </>
      }
    >
      <FreeformCoverEditor
        value={coverLetter}
        onChange={(value) => {
          setCoverLetter(value);
          setCoverLetterMode("freeform");
        }}
      />
    </StepShell>
  );
}
