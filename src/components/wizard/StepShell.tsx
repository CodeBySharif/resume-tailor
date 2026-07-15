"use client";

import type { ReactNode } from "react";

interface StepShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

/** Separates step context (title) from navigation actions. */
export function StepShell({
  title,
  description,
  actions,
  children,
}: StepShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

interface StepChoiceProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Tighter padding / no forced min-height (home cards). */
  compact?: boolean;
}

/** Bordered block for user choices (modes, voices, run buttons). */
export function StepChoice({
  title,
  description,
  children,
  compact = false,
}: StepChoiceProps) {
  return (
    <section
      className={
        compact
          ? "flex flex-col rounded-xl border border-border bg-muted/10 p-3.5"
          : "flex h-full min-h-[280px] flex-col rounded-xl border border-border bg-muted/10 p-5 sm:min-h-[300px] sm:p-6"
      }
    >
      <div className={compact ? "mb-2.5 space-y-0.5" : "mb-4 flex-1 space-y-1"}>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p
            className={
              compact
                ? "text-xs leading-snug text-muted-foreground"
                : "text-sm text-muted-foreground"
            }
          >
            {description}
          </p>
        )}
      </div>
      <div className={compact ? undefined : "mt-auto"}>{children}</div>
    </section>
  );
}
