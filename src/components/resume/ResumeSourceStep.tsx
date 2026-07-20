"use client";

import { ResumeUploadStep } from "./ResumeUploadStep";
import { useResumeStore } from "@/store/resume-store";

export function ResumeSourceStep() {
  const { goToLanding } = useResumeStore();

  return (
    <ResumeUploadStep
      title="Tailor Your Resume"
      description="Upload your resume, then match it to a job description with a tailored resume and cover letter"
      showBack
      onBack={goToLanding}
    />
  );
}
