"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverLetterCanvas } from "@/components/review/CoverLetterCanvas";
import { StepShell } from "@/components/wizard/StepShell";
import { stripCoverLetterSignature } from "@/lib/resume-header";
import { normalizeResume } from "@/lib/resume-schema";
import { useResumeStore } from "@/store/resume-store";

export function EditCoverEditStep() {
  const {
    resume,
    coverLetter,
    jobDetails,
    setCoverLetter,
    setCoverLetterMode,
    updateJobDetails,
    prevStep,
    nextStep,
  } = useResumeStore();

  const body = stripCoverLetterSignature(coverLetter);
  const canContinue = Boolean(body.trim());

  return (
    <StepShell
      title="Edit Cover Letter"
      description="Edit directly in the letter layout — header, recipient, and body stay formatted"
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
              setCoverLetterMode("templated");
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
      <CoverLetterCanvas
        header={normalizeResume(resume).header}
        company={jobDetails.company}
        role={jobDetails.role}
        body={body}
        editable
        onCompanyChange={(company) => updateJobDetails({ company })}
        onRoleChange={(role) => updateJobDetails({ role })}
        onBodyChange={(value) => {
          setCoverLetter(value);
          setCoverLetterMode("templated");
        }}
      />
    </StepShell>
  );
}
