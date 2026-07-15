"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FreeformCoverEditor,
  FreeformCoverPreview,
} from "@/components/review/FreeformCoverEditor";
import { StepShell } from "@/components/wizard/StepShell";
import { createEmptyResume, normalizeResume } from "@/lib/resume-schema";
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
    setCoverLetter,
    setCoverLetterMode,
    resetAll,
    prevStep,
    setStep,
  } = useResumeStore();

  const displayResume = normalizeResume(
    resume.header.name.trim() ? resume : createEmptyResume()
  );

  return (
    <StepShell
      title="Download Cover Letter"
      description="Preview the letter exactly as the PDF — edit freely if needed"
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
          {coverLetter.trim() && (
            <PdfDownloadButtons
              resume={displayResume}
              coverLetter={coverLetter}
              company="Edited"
              role=""
              coverLetterMode={coverLetterMode}
              showResume={false}
              showCover
            />
          )}
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing(!editing)}
          >
            <Pencil className="size-4" />
            {editing ? "Done Editing" : "Edit on page"}
          </Button>
        </div>
        {editing ? (
          <FreeformCoverEditor
            value={coverLetter}
            onChange={(value) => {
              setCoverLetter(value);
              setCoverLetterMode("freeform");
            }}
          />
        ) : (
          <FreeformCoverPreview value={coverLetter} />
        )}
      </div>
    </StepShell>
  );
}
