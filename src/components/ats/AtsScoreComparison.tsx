"use client";

import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AtsCheckResult } from "@/lib/ats-types";
import { cn } from "@/lib/utils";

function scoreBadgeClass(score: number): string {
  if (score >= 75) {
    return "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200";
  }
  if (score >= 55) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200";
  }
  return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200";
}

function ScoreBlock({
  label,
  result,
}: {
  label: string;
  result: AtsCheckResult;
}) {
  return (
    <div className="flex flex-1 flex-col gap-2 rounded-lg border border-border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums">
          {result.overallScore}
        </span>
        <span className="text-sm text-muted-foreground">/ 100</span>
      </div>
      <Badge variant="secondary" className={cn("w-fit tabular-nums", scoreBadgeClass(result.overallScore))}>
        {result.grade}
      </Badge>
    </div>
  );
}

interface AtsScoreComparisonProps {
  before: AtsCheckResult;
  after: AtsCheckResult | null;
  loading?: boolean;
  loadingLabel?: string;
}

export function AtsScoreComparison({
  before,
  after,
  loading = false,
  loadingLabel = "Scoring improved resume…",
}: AtsScoreComparisonProps) {
  const delta = after ? after.overallScore - before.overallScore : null;

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <ScoreBlock label="Before improvement" result={before} />
          {loading ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center">
              <Loader2 className="size-5 animate-spin text-brand-accent" />
              <p className="text-sm text-muted-foreground">{loadingLabel}</p>
            </div>
          ) : after ? (
            <ScoreBlock label="After improvement" result={after} />
          ) : null}
        </div>

        {delta != null && !loading && (
          <p
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium",
              delta > 0
                ? "text-green-700 dark:text-green-300"
                : delta < 0
                  ? "text-amber-700 dark:text-amber-300"
                  : "text-muted-foreground"
            )}
          >
            {delta > 0 ? (
              <TrendingUp className="size-4" />
            ) : delta < 0 ? (
              <TrendingDown className="size-4" />
            ) : null}
            {delta > 0
              ? `+${delta} point${delta === 1 ? "" : "s"} improvement`
              : delta < 0
                ? `${delta} point${delta === -1 ? "" : "s"}`
                : "No change in overall score"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
