"use client";

import { ResumeUploadStep } from "@/components/resume/ResumeUploadStep";
import { useResumeStore } from "@/store/resume-store";

export function AtsUploadStep() {
  const { goToLanding } = useResumeStore();

  return (
    <ResumeUploadStep
      title="Upload Resume"
      description="Upload your PDF to check ATS-friendliness"
      showBack
      onBack={goToLanding}
      clearAtsOnUpload
      allowTemplate={false}
    />
  );
}
