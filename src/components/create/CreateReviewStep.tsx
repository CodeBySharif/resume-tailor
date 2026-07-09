"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { ResumeInlineEditor } from "@/components/review/ResumeInlineEditor";
import { ReviewHeaderEditor } from "@/components/review/ReviewHeaderEditor";
import { StepShell } from "@/components/wizard/StepShell";
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

export function CreateReviewStep() {
  const [editingResume, setEditingResume] = useState(false);

  const { createdResume, resetAll, prevStep } = useResumeStore();

  const displayResume = normalizeResume(createdResume ?? {});

  if (!createdResume) {
    return (
      <p className="text-muted-foreground">
        No resume available. Go back and generate one.
      </p>
    );
  }

  return (
    <StepShell
      title="Your Resume"
      description="Review, edit if needed, and download your ATS-friendly PDF"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={prevStep}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button variant="outline" size="sm" onClick={resetAll}>
            Start Over
          </Button>
          <PdfDownloadButtons
            resume={displayResume}
            coverLetter={null}
            company=""
            role=""
          />
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingResume(!editingResume)}
          >
            <Pencil className="size-4" />
            {editingResume ? "Done Editing" : "Edit Resume"}
          </Button>
        </div>
        {editingResume ? (
          <div className="space-y-4">
            <ReviewHeaderEditor target="created" />
            <ResumeInlineEditor resume={createdResume} target="created" />
          </div>
        ) : null}
        <ResumePreview resume={displayResume} />
      </div>
    </StepShell>
  );
}
