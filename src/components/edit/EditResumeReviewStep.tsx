"use client";

import dynamic from "next/dynamic";
import { ChevronLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { StepShell } from "@/components/wizard/StepShell";
import { normalizeResume } from "@/lib/resume-schema";
import { useResumeStore } from "@/store/resume-store";
import { AiContentDisclaimer } from "@/components/ui/ai-content-disclaimer";

const PdfDownloadButtons = dynamic(
  () => import("@/components/review/PdfDownloadButtons"),
  {
    ssr: false,
    loading: () => (
      <Button disabled size="sm">
        Loading PDF…
      </Button>
    ),
  }
);

export function EditResumeReviewStep() {
  const { resume, resetAll, prevStep, setStep } = useResumeStore();
  const displayResume = normalizeResume(resume);

  return (
    <StepShell
      title="Download Resume"
      description="Preview and download your resume PDF"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={prevStep}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button variant="outline" size="sm" onClick={() => setStep(5)}>
            <Pencil className="size-4" />
            Edit again
          </Button>
          <Button variant="outline" size="sm" onClick={resetAll}>
            Start Over
          </Button>
          <PdfDownloadButtons
            resume={displayResume}
            coverLetter={null}
            company="Edited"
            role=""
            showCover={false}
          />
        </>
      }
    >
      <AiContentDisclaimer compact className="mb-4" />
      <ResumePreview resume={displayResume} />
    </StepShell>
  );
}
