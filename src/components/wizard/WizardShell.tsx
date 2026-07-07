"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { StepIndicator } from "./StepIndicator";
import { ResumeSourceStep } from "@/components/resume/ResumeSourceStep";
import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { JobDetailsForm } from "@/components/job/JobDetailsForm";
import { GenerateStep } from "@/components/generate/GenerateStep";
import { ReviewStep } from "@/components/review/ReviewStep";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { useResumeStore } from "@/store/resume-store";

export function WizardShell() {
  const { step, loadLLMSettings } = useResumeStore();

  useEffect(() => {
    loadLLMSettings();
  }, [loadLLMSettings]);

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-slate-700 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Resume Tailor
            </h1>
            <p className="mt-0.5 text-sm text-primary-foreground/80">
              Tailor your resume and cover letter to any job description
            </p>
          </div>
          <SettingsDialog />
        </div>
      </header>

      <div className="border-b bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <StepIndicator currentStep={step} />
        </div>
      </div>

      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <Card className="min-h-[520px] border shadow-sm p-6 sm:p-8">
            {step === 1 && <ResumeSourceStep />}
            {step === 2 && <ResumeEditor />}
            {step === 3 && <JobDetailsForm />}
            {step === 4 && <GenerateStep />}
            {step === 5 && <ReviewStep />}
          </Card>
        </div>
      </main>
    </div>
  );
}
