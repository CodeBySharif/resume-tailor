"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  { num: 1, label: "Upload Resume" },
  { num: 2, label: "Job Details" },
  { num: 3, label: "Cover Letter" },
  { num: 4, label: "Download" },
] as const;

export function GenerateCvStepIndicator({
  currentStep,
}: {
  currentStep: number;
}) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between gap-1">
        {STEPS.map((step, idx) => {
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
                    "hidden text-center text-xs sm:block",
                    isCurrent
                      ? "font-semibold text-brand-accent"
                      : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
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
