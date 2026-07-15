"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TonePicker } from "@/components/generate/TonePicker";
import { StepChoice, StepShell } from "@/components/wizard/StepShell";
import { AiContentDisclaimer } from "@/components/ui/ai-content-disclaimer";
import { useResumeStore } from "@/store/resume-store";

/** Edit resume step 2 — pick voice only (locks + generate are later). */
export function EditResumeToneStep() {
  const { generationStyle, updateGenerationStyle, prevStep, nextStep } =
    useResumeStore();

  return (
    <StepShell
      title="Writing Voice"
      description="Pick how the rewrite should sound — or Don't rewrite to keep your wording"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={prevStep}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button
            size="sm"
            onClick={nextStep}
            className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            Continue
            <ChevronRight className="size-4" />
          </Button>
        </>
      }
    >
      <AiContentDisclaimer className="mb-4" />

      <StepChoice
        compact
        title="Resume voice"
        description={"Pick “Don't rewrite” to skip AI changes later"}
      >
        <TonePicker
          label="How should this resume sound?"
          description="You'll lock any bullets to keep on the next step"
          value={generationStyle.resumeTone}
          onChange={(resumeTone) => updateGenerationStyle({ resumeTone })}
          exampleType="resume"
        />
      </StepChoice>
    </StepShell>
  );
}
