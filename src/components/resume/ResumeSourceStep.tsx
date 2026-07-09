"use client";

import { ResumeUploadStep } from "./ResumeUploadStep";
import { useResumeStore } from "@/store/resume-store";

export function ResumeSourceStep() {
  const { goToLanding } = useResumeStore();

  return (
    <ResumeUploadStep showBack onBack={goToLanding} />
  );
}
