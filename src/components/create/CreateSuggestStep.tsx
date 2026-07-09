"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchResumeSuggest } from "@/lib/resume-client";
import { validatePrimaryProviderKey } from "@/lib/llm/validate-settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DocumentSkeleton } from "@/components/ui/document-skeleton";
import { StepChoice, StepShell } from "@/components/wizard/StepShell";
import { useResumeStore } from "@/store/resume-store";

export function CreateSuggestStep() {
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    resume,
    llmSettings,
    resumeSuggestions,
    suggestLoading,
    setResumeSuggestions,
    setSuggestLoading,
    setSuggestError,
    prevStep,
    nextStep,
  } = useResumeStore();

  async function runSuggest() {
    const keyError = validatePrimaryProviderKey(llmSettings);
    if (keyError) {
      setLocalError(keyError);
      setSuggestError(keyError);
      return;
    }

    setLocalError(null);
    setSuggestError(null);
    setSuggestLoading(true);

    try {
      const result = await fetchResumeSuggest(resume, llmSettings);
      setResumeSuggestions(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get suggestions";
      setLocalError(msg);
      setSuggestError(msg);
    } finally {
      setSuggestLoading(false);
    }
  }

  return (
    <StepShell
      title="AI Suggestions"
      description="Get personalized tips on what to add and improve"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={prevStep} disabled={suggestLoading}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button
            size="sm"
            disabled={!resumeSuggestions || suggestLoading}
            onClick={nextStep}
            className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            Continue
            <ChevronRight className="size-4" />
          </Button>
        </>
      }
    >
      {!resumeSuggestions && !suggestLoading && (
        <StepChoice
          title="Analyze your draft"
          description="AI will review your resume for gaps in summary, experience bullets, skills, formatting, and more."
        >
          <Button
            size="lg"
            className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
            onClick={() => void runSuggest()}
          >
            Get AI Suggestions
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">Uses 1 API request</p>
        </StepChoice>
      )}

      {suggestLoading && (
        <div className="grid gap-4 lg:grid-cols-2">
          <DocumentSkeleton variant="resume" />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Analyzing draft…</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DocumentSkeleton className="h-24" />
              <DocumentSkeleton className="h-32" />
            </CardContent>
          </Card>
        </div>
      )}

      {localError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {localError}
        </p>
      )}

      {resumeSuggestions && (
        <div className="space-y-4">
          {resumeSuggestions.priorities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Priorities</CardTitle>
                <CardDescription>Highest-impact improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal space-y-2 pl-5 text-sm">
                  {resumeSuggestions.priorities.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {resumeSuggestions.sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="text-base">{section.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {section.findings.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Findings</p>
                    <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                      {section.findings.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {section.suggestions.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Suggestions</p>
                    <ul className="list-disc space-y-1 pl-4">
                      {section.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </StepShell>
  );
}
