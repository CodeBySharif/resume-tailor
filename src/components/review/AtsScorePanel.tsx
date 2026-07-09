"use client";

import { useCallback, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { fetchAtsCheck, fetchGeneralAtsCheck } from "@/lib/ats-client";
import type { AtsCategoryResult } from "@/lib/ats-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { normalizeResume, type Resume } from "@/lib/resume-schema";
import { useResumeStore } from "@/store/resume-store";

function scoreColor(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 55) return "text-amber-600";
  return "text-destructive";
}

function statusIcon(status: AtsCategoryResult["status"]) {
  if (status === "pass") {
    return <CheckCircle2 className="size-4 text-green-600" />;
  }
  if (status === "warning") {
    return <AlertCircle className="size-4 text-amber-600" />;
  }
  return <XCircle className="size-4 text-destructive" />;
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "flex size-28 items-center justify-center rounded-full border-4 bg-muted/30",
          score >= 75
            ? "border-green-500"
            : score >= 55
              ? "border-amber-500"
              : "border-destructive"
        )}
      >
        <div className="text-center">
          <p className={cn("text-3xl font-bold tabular-nums", scoreColor(score))}>
            {score}
          </p>
          <p className="text-xs text-muted-foreground">/ 100</p>
        </div>
      </div>
      <p className="text-sm font-semibold">{grade}</p>
    </div>
  );
}

function CategoryRow({ category }: { category: AtsCategoryResult }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/30"
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        {statusIcon(category.status)}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">{category.label}</span>
            <span className={cn("text-sm font-semibold tabular-nums", scoreColor(category.score))}>
              {category.score}
            </span>
          </div>
          <Progress value={category.score} className="mt-1.5 h-1.5" />
        </div>
      </button>
      {open && (
        <div className="space-y-3 border-t px-4 py-3 text-sm">
          {category.findings.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Findings
              </p>
              <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                {category.findings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          {category.suggestions.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Suggestions
              </p>
              <ul className="list-disc space-y-1 pl-4">
                {category.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface AtsScorePanelProps {
  resume: Resume;
  general?: boolean;
  showRecheck?: boolean;
}

export function AtsScorePanel({
  resume,
  general = false,
  showRecheck = false,
}: AtsScorePanelProps) {
  const {
    jobDetails,
    llmSettings,
    atsResult,
    atsChecking,
    atsError,
    setAtsResult,
    setAtsChecking,
    setAtsError,
  } = useResumeStore();

  const runCheck = useCallback(async () => {
    setAtsChecking(true);
    setAtsError(null);
    try {
      const result = general
        ? await fetchGeneralAtsCheck(normalizeResume(resume), llmSettings)
        : await fetchAtsCheck(normalizeResume(resume), jobDetails, llmSettings);
      setAtsResult(result);
    } catch (err) {
      setAtsError(err instanceof Error ? err.message : "ATS check failed");
    } finally {
      setAtsChecking(false);
    }
  }, [
    resume,
    general,
    jobDetails,
    llmSettings,
    setAtsResult,
    setAtsChecking,
    setAtsError,
  ]);

  const description = general
    ? "Estimates how ATS-friendly and parseable your resume is for applicant tracking systems. Real ATS systems vary — no tool can guarantee a specific employer's ranking."
    : `Estimates how well your resume matches common ATS and recruiter checks for ${jobDetails.role} at ${jobDetails.company}. Real ATS systems vary — no tool can guarantee a specific employer's ranking.`;

  const keywordsTitle = general ? "Industry terms" : "Keywords";
  const keywordsDescription = general
    ? "Relevant industry terms found or missing in your resume"
    : "Important terms from the job description";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>ATS Score</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {atsResult ? (
              <ScoreRing
                score={atsResult.overallScore}
                grade={atsResult.grade}
              />
            ) : (
              <div className="flex size-28 items-center justify-center rounded-full border-4 border-muted bg-muted/20">
                {atsChecking ? (
                  <Loader2 className="size-8 animate-spin text-brand-accent" />
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            )}
            {showRecheck && (
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={atsChecking}
                  onClick={() => void runCheck()}
                >
                  {atsChecking ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  {atsChecking ? "Checking…" : "Re-check ATS"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Uses 1 API request per check
                </p>
              </div>
            )}
          </div>

          {atsError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {atsError}
            </p>
          )}
        </CardContent>
      </Card>

      {atsResult && (
        <>
          {atsResult.topPriorities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Priorities</CardTitle>
                <CardDescription>
                  Highest-impact fixes to improve your score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal space-y-2 pl-5 text-sm">
                  {atsResult.topPriorities.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {atsResult.categories.map((category) => (
                <CategoryRow key={category.id} category={category} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{keywordsTitle}</CardTitle>
              <CardDescription>{keywordsDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {atsResult.matchedKeywords.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Found
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {atsResult.matchedKeywords.map((kw) => (
                      <Badge
                        key={kw}
                        variant="secondary"
                        className="bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-200"
                      >
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {atsResult.missingKeywords.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Missing or weak
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {atsResult.missingKeywords.map((kw) => (
                      <Badge
                        key={kw}
                        variant="outline"
                        className="border-amber-300 text-amber-800 dark:text-amber-200"
                      >
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {atsResult.matchedKeywords.length === 0 &&
                atsResult.missingKeywords.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No keyword analysis returned.
                  </p>
                )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
