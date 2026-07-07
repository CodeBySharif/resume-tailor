"use client";

import { cn } from "@/lib/utils";

interface SmoothProgressBarProps {
  value: number;
  className?: string;
}

export function SmoothProgressBar({ value, className }: SmoothProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
    >
      <div
        className="h-full rounded-full bg-brand-accent transition-[width] duration-75 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
