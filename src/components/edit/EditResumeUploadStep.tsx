"use client";

import { ResumeUploadStep } from "@/components/resume/ResumeUploadStep";
import { useResumeStore } from "@/store/resume-store";

/** Select PDF instantly; AI parse runs on Continue. Reuses session master when set. */
export function EditResumeUploadStep() {
  const goToLanding = useResumeStore((s) => s.goToLanding);

  return (
    <ResumeUploadStep
      title="Edit Resume"
      description="Select a PDF to preview, then continue to parse it into editable sections"
      showBack
      onBack={goToLanding}
      allowTemplate={false}
    />
  );
}
