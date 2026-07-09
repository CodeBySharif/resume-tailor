"use client";

import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { useResumeStore } from "@/store/resume-store";

export function CreateBuildStep() {
  const { goToLanding } = useResumeStore();

  return (
    <ResumeEditor
      title="Build Your Resume"
      description="Fill in ATS-friendly sections — contact info, summary, experience, skills, and education"
      onBack={goToLanding}
      showContinueRequirements
    />
  );
}
