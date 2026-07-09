"use client";

import { cn } from "@/lib/utils";
import { SmoothProgressBar } from "./smooth-progress-bar";

interface OperationProgressProps {
  value: number;
  label?: string;
  status?: string;
  hint?: string;
  elapsedSec?: number;
  className?: string;
}

/** Single source of truth: bar width and % label use the same value. */
export function OperationProgress({
  value,
  label = "Progress",
  status,
  hint,
  elapsedSec,
  className,
}: OperationProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const displayPercent = Math.round(clamped);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums font-medium text-brand-accent">
          {displayPercent}%
        </span>
      </div>
      <SmoothProgressBar value={clamped} />
      {status && <p className="text-sm font-medium">{status}</p>}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      {elapsedSec != null && elapsedSec > 0 && (
        <p className="text-xs text-muted-foreground tabular-nums">
          Elapsed: {elapsedSec}s
        </p>
      )}
    </div>
  );
}
