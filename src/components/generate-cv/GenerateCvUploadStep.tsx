"use client";

import { ResumeUploadStep } from "@/components/resume/ResumeUploadStep";
import { useResumeStore } from "@/store/resume-store";

/** Generate cover letter step 1 — same upload UX as Tailor / ATS. */
export function GenerateCvUploadStep() {
  const { goToLanding } = useResumeStore();

  return (
    <ResumeUploadStep
      title="Generate Cover Letter"
      description="Upload a resume PDF, then continue"
      showBack
      onBack={goToLanding}
      allowTemplate={false}
    />
  );
}
