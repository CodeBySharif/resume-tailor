"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { StepIndicator } from "./StepIndicator";
import { AtsStepIndicator } from "./AtsStepIndicator";
import { CreateStepIndicator } from "./CreateStepIndicator";
import { ModePicker } from "./ModePicker";
import { ResumeSourceStep } from "@/components/resume/ResumeSourceStep";
import { ResumeEditor } from "@/components/resume/ResumeEditor";
import { JobDetailsForm } from "@/components/job/JobDetailsForm";
import { GenerateStep } from "@/components/generate/GenerateStep";
import { ReviewStep } from "@/components/review/ReviewStep";
import { CreateBuildStep } from "@/components/create/CreateBuildStep";
import { CreateSuggestStep } from "@/components/create/CreateSuggestStep";
import { CreateGenerateStep } from "@/components/create/CreateGenerateStep";
import { CreateReviewStep } from "@/components/create/CreateReviewStep";
import { AtsUploadStep } from "@/components/ats/AtsUploadStep";
import { AtsScoreStep } from "@/components/ats/AtsScoreStep";
import { AtsFixStep } from "@/components/ats/AtsFixStep";
import { AtsReviewStep } from "@/components/ats/AtsReviewStep";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { FlowNav } from "./FlowNav";
import { useResumeStore } from "@/store/resume-store";

function getSubtitle(flow: "landing" | "create" | "tailor" | "ats"): string {
  if (flow === "create") {
    return "Build an ATS-friendly resume from scratch";
  }
  if (flow === "tailor") {
    return "Tailor your resume and cover letter to any job description";
  }
  if (flow === "ats") {
    return "Check and improve your resume for ATS systems";
  }
  return "Create, tailor, or check your resume for ATS";
}

export function WizardShell() {
  const { flow, step, loadLLMSettings } = useResumeStore();

  useEffect(() => {
    loadLLMSettings();
  }, [loadLLMSettings]);

  return (
    <div className="flex min-h-full flex-col">
      <header className="relative border-b border-slate-700 bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-4 py-5">
          <div className="relative min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight">
              Resume Tailor
            </h1>
            <p className="mt-0.5 text-sm text-primary-foreground/80">
              {getSubtitle(flow)}
            </p>
            <FlowNav />
          </div>
          <div className="shrink-0 pt-0.5">
            <SettingsDialog />
          </div>
        </div>
      </header>

      {flow !== "landing" && (
        <div className="border-b bg-secondary">
          <div className="mx-auto max-w-6xl px-4 py-4">
            {flow === "create" && <CreateStepIndicator currentStep={step} />}
            {flow === "tailor" && <StepIndicator currentStep={step} />}
            {flow === "ats" && <AtsStepIndicator currentStep={step} />}
          </div>
        </div>
      )}

      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Card className="min-h-[520px] overflow-visible border shadow-sm px-5 py-6 sm:px-8 sm:py-8">
            {flow === "landing" && <ModePicker />}

            {flow === "create" && step === 1 && <CreateBuildStep />}
            {flow === "create" && step === 2 && <CreateSuggestStep />}
            {flow === "create" && step === 3 && <CreateGenerateStep />}
            {flow === "create" && step === 4 && <CreateReviewStep />}

            {flow === "tailor" && step === 1 && <ResumeSourceStep />}
            {flow === "tailor" && step === 2 && <ResumeEditor />}
            {flow === "tailor" && step === 3 && <JobDetailsForm />}
            {flow === "tailor" && step === 4 && <GenerateStep />}
            {flow === "tailor" && step === 5 && <ReviewStep />}

            {flow === "ats" && step === 1 && <AtsUploadStep />}
            {flow === "ats" && step === 2 && <AtsScoreStep />}
            {flow === "ats" && step === 3 && <AtsFixStep />}
            {flow === "ats" && step === 4 && <AtsReviewStep />}
          </Card>
        </div>
      </main>
    </div>
  );
}
