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

export function EditCoverReviewStep() {
  const [editing, setEditing] = useState(false);
  const {
    resume,
    coverLetter,
    coverLetterMode,
    jobDetails,
    setCoverLetter,
    setCoverLetterMode,
    updateJobDetails,
    resetAll,
    prevStep,
    setStep,
  } = useResumeStore();

  const displayResume = normalizeResume(resume);
  const body = stripCoverLetterSignature(coverLetter);

  return (
    <StepShell
      title="Download Cover Letter"
      description="Preview and download the formatted letter — edit on the page if needed"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={prevStep}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditing(false);
              setStep(3);
            }}
          >
            <Pencil className="size-4" />
            Edit again
          </Button>
          <Button variant="outline" size="sm" onClick={resetAll}>
            Start Over
          </Button>
          {body.trim() && (
            <PdfDownloadButtons
              resume={displayResume}
              coverLetter={coverLetter}
              company={jobDetails.company || "Company"}
              role={jobDetails.role}
              coverLetterMode={coverLetterMode}
              showResume={false}
              showCover
            />
          )}
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Cover letter</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(!editing)}
          >
            <Pencil className="size-4" />
            {editing ? "Done Editing" : "Edit Cover Letter"}
          </Button>
        </div>
        <CoverLetterCanvas
          header={displayResume.header}
          company={jobDetails.company}
          role={jobDetails.role}
          body={body}
          editable={editing}
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
