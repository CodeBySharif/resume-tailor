"use client";

import { Lock, LockOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Resume } from "@/lib/resume-schema";
import {
  SUMMARY_LOCK,
  experienceBulletLock,
  projectBulletLock,
  type RewriteLockKey,
} from "@/lib/rewrite-locks";

function LockToggle({
  locked,
  onToggle,
  label,
}: {
  locked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-pressed={locked}
      aria-label={locked ? `Unlock: ${label}` : `Lock: ${label}`}
      title={locked ? "Locked — AI will not rewrite" : "Unlocked — AI may rewrite"}
      onClick={onToggle}
      className={cn(
        locked
          ? "text-brand-accent hover:text-brand-accent"
          : "text-muted-foreground"
      )}
    >
      {locked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
    </Button>
  );
}

interface BulletLockPanelProps {
  resume: Resume;
  locks: string[];
  onToggle: (key: RewriteLockKey) => void;
  onLockAll: () => void;
  onUnlockAll: () => void;
  className?: string;
}

export function BulletLockPanel({
  resume,
  locks,
  onToggle,
  onLockAll,
  onUnlockAll,
  className,
}: BulletLockPanelProps) {
  const lockSet = new Set(locks);
  const hasContent =
    Boolean(resume.summary.trim()) ||
    resume.experience.some((e) => e.bullets.some((b) => b.trim())) ||
    resume.projects.some((p) => p.bullets.some((b) => b.trim()));

  if (!hasContent) return null;

  return (
    <div className={cn("space-y-3 rounded-lg border bg-muted/20 p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Lock bullets to keep</p>
          <p className="text-xs text-muted-foreground">
            Locked points stay exactly as written. Unlocked points can be rewritten.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onLockAll}>
            Lock all
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onUnlockAll}>
            Unlock all
          </Button>
        </div>
      </div>

      {resume.summary.trim() && (
        <div className="flex items-start gap-2 rounded-md border bg-background px-3 py-2">
          <LockToggle
            locked={lockSet.has(SUMMARY_LOCK)}
            onToggle={() => onToggle(SUMMARY_LOCK)}
            label="Professional summary"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">Summary</p>
            <p className="text-sm leading-snug">{resume.summary}</p>
          </div>
        </div>
      )}

      {resume.experience.map((exp) => {
        const bullets = exp.bullets.filter((b) => b.trim());
        if (bullets.length === 0) return null;
        return (
          <div key={exp.id} className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              {exp.role}
              {exp.company ? ` · ${exp.company}` : ""}
            </p>
            <ul className="space-y-1.5">
              {exp.bullets.map((bullet, index) => {
                if (!bullet.trim()) return null;
                const key = experienceBulletLock(exp.id, index);
                return (
                  <li
                    key={key}
                    className="flex items-start gap-2 rounded-md border bg-background px-3 py-2"
                  >
                    <LockToggle
                      locked={lockSet.has(key)}
                      onToggle={() => onToggle(key)}
                      label={bullet.slice(0, 80)}
                    />
                    <p className="min-w-0 flex-1 text-sm leading-snug">{bullet}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {resume.projects.map((project) => {
        const bullets = project.bullets.filter((b) => b.trim());
        if (bullets.length === 0) return null;
        return (
          <div key={project.id} className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Project · {project.name}
            </p>
            <ul className="space-y-1.5">
              {project.bullets.map((bullet, index) => {
                if (!bullet.trim()) return null;
                const key = projectBulletLock(project.id, index);
                return (
                  <li
                    key={key}
                    className="flex items-start gap-2 rounded-md border bg-background px-3 py-2"
                  >
                    <LockToggle
                      locked={lockSet.has(key)}
                      onToggle={() => onToggle(key)}
                      label={bullet.slice(0, 80)}
                    />
                    <p className="min-w-0 flex-1 text-sm leading-snug">{bullet}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {locks.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {locks.length} locked item{locks.length === 1 ? "" : "s"} will be preserved.
        </p>
      )}
    </div>
  );
}

/** Collect every lockable key on a resume (summary + non-empty bullets). */
export function collectAllRewriteLocks(resume: Resume): string[] {
  const keys: string[] = [];
  if (resume.summary.trim()) keys.push(SUMMARY_LOCK);
  for (const exp of resume.experience) {
    exp.bullets.forEach((bullet, index) => {
      if (bullet.trim()) keys.push(experienceBulletLock(exp.id, index));
    });
  }
  for (const project of resume.projects) {
    project.bullets.forEach((bullet, index) => {
      if (bullet.trim()) keys.push(projectBulletLock(project.id, index));
    });
  }
  return keys;
}
