"use client";

import { ResumeUploadStep } from "@/components/resume/ResumeUploadStep";
import { useResumeStore } from "@/store/resume-store";

export function AtsUploadStep() {
  const { goToLanding } = useResumeStore();

  return (
    <ResumeUploadStep
      title="Check ATS Readiness"
      description="Upload your resume PDF to score ATS-friendliness, get fix suggestions, then generate an improved version"
      showBack
      onBack={goToLanding}
      clearAtsOnUpload
      allowTemplate={false}
    />
  );
}
