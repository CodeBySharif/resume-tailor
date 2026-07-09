"use client";

import { Badge } from "@/components/ui/badge";
import { TonePicker } from "./TonePicker";
import { getToneLabel } from "@/lib/writing-tone";
import { useResumeStore } from "@/store/resume-store";

export function ResumeVoicePanel() {
  const { generationStyle, updateGenerationStyle } = useResumeStore();

  return (
    <div className="space-y-4">
      <TonePicker
        label="Resume voice"
        description="How your resume bullets and summary are written"
        value={generationStyle.resumeTone}
        onChange={(resumeTone) => updateGenerationStyle({ resumeTone })}
        exampleType="resume"
      />
      <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-background px-4 py-3 text-sm">
        <span className="text-muted-foreground">Selected:</span>
        <Badge variant="secondary">
          {getToneLabel(generationStyle.resumeTone)}
        </Badge>
      </div>
    </div>
  );
}
