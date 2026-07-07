"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Resume } from "@/lib/resume-schema";
import { moveArrayItem } from "@/lib/array-utils";
import { ReorderButtons } from "@/components/resume/ReorderButtons";
import { MonthYearInput } from "@/components/resume/MonthYearInput";
import { isPresentDate } from "@/lib/date-utils";
import { useResumeStore } from "@/store/resume-store";

function SectionBlock({
  title,
  reorder,
  children,
}: {
  title: string;
  reorder?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-foreground">{title}</p>
        {reorder}
      </div>
      {children}
    </div>
  );
}

interface ResumeInlineEditorProps {
  resume: Resume;
}

export function ResumeInlineEditor({ resume }: ResumeInlineEditorProps) {
  const { updateTailoredResume } = useResumeStore();

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          Professional Summary
        </Label>
        <Textarea
          rows={4}
          value={resume.summary}
          onChange={(e) =>
            updateTailoredResume((r) => ({ ...r, summary: e.target.value }))
          }
        />
      </div>

      {resume.experience.map((exp, expIdx) => {
        const isCurrent = isPresentDate(exp.endDate);
        return (
        <SectionBlock
          key={exp.id}
          title={`Experience ${expIdx + 1}${exp.role ? ` — ${exp.role}` : ""}`}
          reorder={
            <ReorderButtons
              index={expIdx}
              total={resume.experience.length}
              onMoveUp={() =>
                updateTailoredResume((r) => ({
                  ...r,
                  experience: moveArrayItem(r.experience, expIdx, expIdx - 1),
                }))
              }
              onMoveDown={() =>
                updateTailoredResume((r) => ({
                  ...r,
                  experience: moveArrayItem(r.experience, expIdx, expIdx + 1),
                }))
              }
            />
          }
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Input
                value={exp.role}
                onChange={(e) =>
                  updateTailoredResume((r) => {
                    const experience = [...r.experience];
                    experience[expIdx] = { ...exp, role: e.target.value };
                    return { ...r, experience };
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Company</Label>
              <Input
                value={exp.company}
                onChange={(e) =>
                  updateTailoredResume((r) => {
                    const experience = [...r.experience];
                    experience[expIdx] = { ...exp, company: e.target.value };
                    return { ...r, experience };
                  })
                }
              />
            </div>
            <MonthYearInput
              id={`review-exp-start-${exp.id}`}
              label="Start Date"
              value={exp.startDate}
              onChange={(v) =>
                updateTailoredResume((r) => {
                  const experience = [...r.experience];
                  experience[expIdx] = { ...exp, startDate: v };
                  return { ...r, experience };
                })
              }
            />
            <MonthYearInput
              id={`review-exp-end-${exp.id}`}
              label="End Date"
              value={isCurrent ? "" : exp.endDate}
              disabled={isCurrent}
              onChange={(v) =>
                updateTailoredResume((r) => {
                  const experience = [...r.experience];
                  experience[expIdx] = { ...exp, endDate: v };
                  return { ...r, experience };
                })
              }
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) =>
                updateTailoredResume((r) => {
                  const experience = [...r.experience];
                  experience[expIdx] = {
                    ...exp,
                    endDate: e.target.checked ? "Present" : "",
                  };
                  return { ...r, experience };
                })
              }
            />
            Currently working here
          </label>
          {exp.bullets.map((bullet, bulletIdx) => (
            <div key={bulletIdx} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Bullet {bulletIdx + 1}
              </Label>
              <Textarea
                rows={2}
                value={bullet}
                onChange={(e) =>
                  updateTailoredResume((r) => {
                    const experience = [...r.experience];
                    const bullets = [...exp.bullets];
                    bullets[bulletIdx] = e.target.value;
                    experience[expIdx] = { ...exp, bullets };
                    return { ...r, experience };
                  })
                }
              />
            </div>
          ))}
        </SectionBlock>
        );
      })}

      {resume.projects.map((proj, projIdx) => (
        <SectionBlock
          key={proj.id}
          title={`Project ${projIdx + 1}${proj.name ? ` — ${proj.name}` : ""}`}
        >
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Project Name</Label>
            <Input
              value={proj.name}
              onChange={(e) =>
                updateTailoredResume((r) => {
                  const projects = [...r.projects];
                  projects[projIdx] = { ...proj, name: e.target.value };
                  return { ...r, projects };
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              rows={3}
              value={proj.description}
              onChange={(e) =>
                updateTailoredResume((r) => {
                  const projects = [...r.projects];
                  projects[projIdx] = { ...proj, description: e.target.value };
                  return { ...r, projects };
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tech Stack</Label>
            <Input
              value={(proj.technologies ?? []).join(", ")}
              onChange={(e) =>
                updateTailoredResume((r) => {
                  const projects = [...r.projects];
                  projects[projIdx] = {
                    ...proj,
                    technologies: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  };
                  return { ...r, projects };
                })
              }
            />
          </div>
        </SectionBlock>
      ))}

      {resume.education.map((edu, eduIdx) => (
        <SectionBlock
          key={edu.id}
          title={`Education ${eduIdx + 1}${edu.institution ? ` — ${edu.institution}` : ""}`}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Institution</Label>
              <Input
                value={edu.institution}
                onChange={(e) =>
                  updateTailoredResume((r) => {
                    const education = [...r.education];
                    education[eduIdx] = { ...edu, institution: e.target.value };
                    return { ...r, education };
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Degree</Label>
              <Input
                value={edu.degree}
                onChange={(e) =>
                  updateTailoredResume((r) => {
                    const education = [...r.education];
                    education[eduIdx] = { ...edu, degree: e.target.value };
                    return { ...r, education };
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Field</Label>
              <Input
                value={edu.field ?? ""}
                onChange={(e) =>
                  updateTailoredResume((r) => {
                    const education = [...r.education];
                    education[eduIdx] = { ...edu, field: e.target.value };
                    return { ...r, education };
                  })
                }
              />
            </div>
          </div>
        </SectionBlock>
      ))}

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Skills</Label>
        <Textarea
          rows={2}
          value={resume.skills.join(", ")}
          onChange={(e) =>
            updateTailoredResume((r) => ({
              ...r,
              skills: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }))
          }
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Languages</Label>
        <Textarea
          rows={2}
          value={resume.languages.join(", ")}
          onChange={(e) =>
            updateTailoredResume((r) => ({
              ...r,
              languages: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }))
          }
        />
      </div>

      {resume.customSections.map((section, secIdx) => (
        <SectionBlock key={section.id} title={`${section.title || `Section ${secIdx + 1}`}`}>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Section Title</Label>
            <Input
              value={section.title}
              onChange={(e) =>
                updateTailoredResume((r) => {
                  const customSections = [...r.customSections];
                  customSections[secIdx] = { ...section, title: e.target.value };
                  return { ...r, customSections };
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Content</Label>
            <Textarea
              rows={4}
              value={section.content}
              onChange={(e) =>
                updateTailoredResume((r) => {
                  const customSections = [...r.customSections];
                  customSections[secIdx] = { ...section, content: e.target.value };
                  return { ...r, customSections };
                })
              }
            />
          </div>
        </SectionBlock>
      ))}
    </div>
  );
}
