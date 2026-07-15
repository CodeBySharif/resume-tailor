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
import { EditDocStepIndicator } from "@/components/edit/EditDocStepIndicator";
import { EditResumeUploadStep } from "@/components/edit/EditResumeUploadStep";
import { EditResumeToneStep } from "@/components/edit/EditResumeToneStep";
import { EditResumeLockStep } from "@/components/edit/EditResumeLockStep";
import { EditResumeGenerateStep } from "@/components/edit/EditResumeGenerateStep";
import { EditResumeEditStep } from "@/components/edit/EditResumeEditStep";
import { EditResumeReviewStep } from "@/components/edit/EditResumeReviewStep";
import { EditCoverUploadStep } from "@/components/edit/EditCoverUploadStep";
import { EditCoverToneStep } from "@/components/edit/EditCoverToneStep";
import { EditCoverEditStep } from "@/components/edit/EditCoverEditStep";
import { EditCoverReviewStep } from "@/components/edit/EditCoverReviewStep";
import { GenerateCvStepIndicator } from "@/components/generate-cv/GenerateCvStepIndicator";
import { GenerateCvUploadStep } from "@/components/generate-cv/GenerateCvUploadStep";
import { GenerateCvReviewStep } from "@/components/generate-cv/GenerateCvReviewStep";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { FlowNav } from "./FlowNav";
import { useResumeStore, type AppFlow } from "@/store/resume-store";

function getSubtitle(flow: AppFlow): string {
  if (flow === "create") {
    return "Build an ATS-friendly resume from scratch";
  }
  if (flow === "tailor") {
    return "Tailor your resume and cover letter to any job description";
  }
  if (flow === "ats") {
    return "Check and improve your resume for ATS systems";
  }
  if (flow === "edit-resume") {
    return "Upload and edit your resume";
  }
  if (flow === "edit-cover") {
    return "Upload and edit your cover letter as-is";
  }
  if (flow === "generate-cv") {
    return "Generate a cover letter from your resume and job details";
  }
  return "Create, tailor, edit, or check your resume for ATS";
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
            {flow === "edit-resume" && (
              <EditDocStepIndicator currentStep={step} variant="resume" />
            )}
            {flow === "edit-cover" && (
              <EditDocStepIndicator currentStep={step} variant="cover" />
            )}
            {flow === "generate-cv" && (
              <GenerateCvStepIndicator currentStep={step} />
            )}
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

            {flow === "edit-resume" && step === 1 && <EditResumeUploadStep />}
            {flow === "edit-resume" && step === 2 && <EditResumeToneStep />}
            {flow === "edit-resume" && step === 3 && <EditResumeLockStep />}
            {flow === "edit-resume" && step === 4 && <EditResumeGenerateStep />}
            {flow === "edit-resume" && step === 5 && <EditResumeEditStep />}
            {flow === "edit-resume" && step === 6 && <EditResumeReviewStep />}

            {flow === "edit-cover" && step === 1 && <EditCoverUploadStep />}
            {flow === "edit-cover" && step === 2 && <EditCoverToneStep />}
            {flow === "edit-cover" && step === 3 && <EditCoverEditStep />}
            {flow === "edit-cover" && step === 4 && <EditCoverReviewStep />}

            {flow === "generate-cv" && step === 1 && <GenerateCvUploadStep />}
            {flow === "generate-cv" && step === 2 && <JobDetailsForm />}
            {flow === "generate-cv" && step === 3 && <GenerateStep />}
            {flow === "generate-cv" && step === 4 && <GenerateCvReviewStep />}
          </Card>
        </div>
      </main>
    </div>
  );
}
