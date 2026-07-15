"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiContentDisclaimer({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="note"
      className={cn(
        "flex gap-3 rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-3 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100",
        className
      )}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" />
      <div className="space-y-1 text-sm leading-relaxed">
        <p className="font-medium">
          AI may exaggerate — please review before you apply
        </p>
        {!compact && (
          <p className="text-amber-900/90 dark:text-amber-100/90">
            Generative rewrites (especially Metrics-Driven) can invent or inflate
            numbers and soft claims. Lock any bullets you want unchanged below,
            then use{" "}
            <span className="font-medium">Edit Resume</span> or{" "}
            <span className="font-medium">Edit Cover Letter</span> afterward to
            correct anything that isn&apos;t accurate.
          </p>
        )}
        {compact && (
          <p className="text-amber-900/90 dark:text-amber-100/90">
            Double-check claims and metrics. Fix issues with{" "}
            <span className="font-medium">Edit Resume</span> /{" "}
            <span className="font-medium">Edit Cover Letter</span>.
          </p>
        )}
      </div>
    </div>
  );
}
