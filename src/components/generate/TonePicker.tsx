"use client";

import { cn } from "@/lib/utils";
import {
  type WritingTone,
  WRITING_TONES,
  getToneOption,
} from "@/lib/writing-tone";

interface TonePickerProps {
  label: string;
  description: string;
  value: WritingTone;
  onChange: (tone: WritingTone) => void;
  exampleType: "resume" | "coverLetter";
}

export function TonePicker({
  label,
  description,
  value,
  onChange,
  exampleType,
}: TonePickerProps) {
  const selected = getToneOption(value);
  const example =
    exampleType === "resume"
      ? selected.resumeExample
      : selected.coverLetterExample;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {WRITING_TONES.map((tone) => (
          <button
            key={tone.id}
            type="button"
            onClick={() => onChange(tone.id)}
            className={cn(
              "rounded-lg border p-3 text-left transition-colors",
              value === tone.id
                ? "border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent"
                : "border-border hover:border-brand-accent/40 hover:bg-muted/30"
            )}
          >
            <p className="text-sm font-medium">{tone.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
              {tone.description}
            </p>
          </button>
        ))}
      </div>

      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          Example — {selected.label}
        </p>
        <p className="text-sm leading-relaxed text-foreground">{example}</p>
      </div>
    </div>
  );
}
