"use client";

import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { useResumeStore } from "@/store/resume-store";

export function EditResumeEditStep() {
  const { prevStep } = useResumeStore();

  return (
    <ResumeEditor
      title="Edit Resume"
      description="Update sections — live preview updates on the right"
      onBack={prevStep}
      allowContinueWithoutContact
    />
  );
}
