"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoverLetterCanvas } from "@/components/review/CoverLetterCanvas";
import { StepShell } from "@/components/wizard/StepShell";
import { stripCoverLetterSignature } from "@/lib/resume-header";
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

export function GenerateCvReviewStep() {
  const [editingCover, setEditingCover] = useState(false);

  const {
    resume,
    coverLetter,
    coverLetterMode,
    jobDetails,
    setCoverLetter,
    updateJobDetails,
    setCoverLetterMode,
    resetAll,
    prevStep,
    setStep,
  } = useResumeStore();

  const displayResume = normalizeResume(resume);
  const body = stripCoverLetterSignature(coverLetter);

  return (
    <StepShell
      title="Review Cover Letter"
      description="Preview, edit, and download your generated cover letter"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={prevStep}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button variant="outline" size="sm" onClick={() => setStep(3)}>
            Regenerate
          </Button>
          <Button variant="outline" size="sm" onClick={resetAll}>
            Start Over
          </Button>
          <PdfDownloadButtons
            resume={displayResume}
            coverLetter={coverLetter || null}
            company={jobDetails.company}
            role={jobDetails.role}
            coverLetterMode={coverLetterMode}
            showResume={false}
          />
        </>
      }
    >
      <AiContentDisclaimer compact className="mb-4" />
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Cover letter</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingCover(!editingCover)}
          >
            <Pencil className="size-4" />
            {editingCover ? "Done Editing" : "Edit Cover Letter"}
          </Button>
        </div>
        <CoverLetterCanvas
          header={displayResume.header}
          company={jobDetails.company}
          role={jobDetails.role}
          body={body}
          editable={editingCover}
          onCompanyChange={(company) => updateJobDetails({ company })}
          onRoleChange={(role) => updateJobDetails({ role })}
          onBodyChange={(value) => {
            setCoverLetter(value);
            setCoverLetterMode("templated");
          }}
        />
      </div>
    </StepShell>
  );
}
