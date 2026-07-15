import type { Resume } from "@/lib/resume-schema";

/** Lock keys: `summary` | `exp:{id}:{index}` | `proj:{id}:{index}` */
export type RewriteLockKey = string;

export const SUMMARY_LOCK = "summary";

export function experienceBulletLock(experienceId: string, index: number): RewriteLockKey {
  return `exp:${experienceId}:${index}`;
}

export function projectBulletLock(projectId: string, index: number): RewriteLockKey {
  return `proj:${projectId}:${index}`;
}

export function formatRewriteLocksForPrompt(
  resume: Resume,
  locks: string[]
): string {
  if (!locks.length) return "";

  const lockSet = new Set(locks);
  const lines: string[] = [
    "LOCKED CONTENT — copy these strings EXACTLY into the output resume. Do not paraphrase, reorder, or improve locked items:",
  ];

  if (lockSet.has(SUMMARY_LOCK) && resume.summary.trim()) {
    lines.push(`- summary: ${JSON.stringify(resume.summary)}`);
  }

  for (const exp of resume.experience) {
    exp.bullets.forEach((bullet, index) => {
      if (!bullet.trim()) return;
      if (!lockSet.has(experienceBulletLock(exp.id, index))) return;
      lines.push(
        `- experience id=${exp.id} bullet[${index}] (${exp.role} @ ${exp.company}): ${JSON.stringify(bullet)}`
      );
    });
  }

  for (const project of resume.projects) {
    project.bullets.forEach((bullet, index) => {
      if (!bullet.trim()) return;
      if (!lockSet.has(projectBulletLock(project.id, index))) return;
      lines.push(
        `- project id=${project.id} bullet[${index}] (${project.name}): ${JSON.stringify(bullet)}`
      );
    });
  }

  if (lines.length === 1) return "";

  lines.push(
    "Unlocked bullets and summary (if unlocked) may be rewritten. Keep all id fields unchanged."
  );
  return `\n${lines.join("\n")}\n`;
}

/** Hard-enforce locks after the model runs — never trusts the LLM alone. */
export function applyRewriteLocks(
  original: Resume,
  next: Resume,
  locks: string[]
): Resume {
  if (!locks.length) return next;

  const lockSet = new Set(locks);
  const result: Resume = {
    ...next,
    header: { ...next.header },
    experience: next.experience.map((e) => ({
      ...e,
      bullets: [...e.bullets],
    })),
    projects: next.projects.map((p) => ({
      ...p,
      bullets: [...p.bullets],
      technologies: p.technologies ? [...p.technologies] : undefined,
    })),
    education: [...next.education],
    skills: [...next.skills],
    languages: [...next.languages],
    customSections: [...next.customSections],
  };

  if (lockSet.has(SUMMARY_LOCK)) {
    result.summary = original.summary;
  }

  for (const exp of original.experience) {
    const target = result.experience.find((e) => e.id === exp.id);
    if (!target) continue;
    exp.bullets.forEach((bullet, index) => {
      if (!lockSet.has(experienceBulletLock(exp.id, index))) return;
      if (index < target.bullets.length) {
        target.bullets[index] = bullet;
      } else {
        target.bullets.push(bullet);
      }
    });
  }

  for (const project of original.projects) {
    const target = result.projects.find((p) => p.id === project.id);
    if (!target) continue;
    project.bullets.forEach((bullet, index) => {
      if (!lockSet.has(projectBulletLock(project.id, index))) return;
      if (index < target.bullets.length) {
        target.bullets[index] = bullet;
      } else {
        target.bullets.push(bullet);
      }
    });
  }

  return result;
}
