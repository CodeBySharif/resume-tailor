"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const RESUME_STEPS = [
  { num: 1, label: "Upload" },
  { num: 2, label: "Voice" },
  { num: 3, label: "Lock" },
  { num: 4, label: "Generate" },
  { num: 5, label: "Edit" },
  { num: 6, label: "Download" },
] as const;

const COVER_STEPS = [
  { num: 1, label: "Upload" },
  { num: 2, label: "Voice" },
  { num: 3, label: "Edit" },
  { num: 4, label: "Download" },
] as const;

export function EditDocStepIndicator({
  currentStep,
  variant = "resume",
}: {
  currentStep: number;
  variant?: "resume" | "cover";
}) {
  const steps = variant === "cover" ? COVER_STEPS : RESUME_STEPS;

  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between gap-1">
        {steps.map((step, idx) => {
          const isComplete = currentStep > step.num;
          const isCurrent = currentStep === step.num;

          return (
            <li key={step.num} className="flex flex-1 items-center">
              <div className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    isComplete &&
                      "border-brand-accent bg-brand-accent text-brand-accent-foreground",
                    isCurrent &&
                      "border-brand-accent bg-brand-accent/10 text-brand-accent",
                    !isComplete &&
                      !isCurrent &&
                      "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {isComplete ? <Check className="size-4" /> : step.num}
                </div>
                <span
                  className={cn(
                    "hidden text-center text-[10px] sm:block sm:text-xs",
                    isCurrent
                      ? "font-semibold text-brand-accent"
                      : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 flex-1 transition-colors",
                    isComplete ? "bg-brand-accent" : "bg-border"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
