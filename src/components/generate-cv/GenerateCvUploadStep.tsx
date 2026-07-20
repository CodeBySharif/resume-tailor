"use client";

import { ResumeUploadStep } from "@/components/resume/ResumeUploadStep";
import { useResumeStore } from "@/store/resume-store";

/** Generate cover letter step 1 — same upload UX as Tailor / ATS. */
export function GenerateCvUploadStep() {
  const { goToLanding } = useResumeStore();

  return (
    <ResumeUploadStep
      title="Generate Your Cover Letter"
      description="Upload your resume, add the job details, then generate a cover letter in your chosen writing voice"
      showBack
      onBack={goToLanding}
      allowTemplate={false}
    />
  );
}
