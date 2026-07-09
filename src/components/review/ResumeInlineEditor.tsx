"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StringListField } from "@/components/ui/string-list-field";
import { LanguageListField } from "@/components/ui/language-list-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getProjectBullets,
  projectDescriptionFromBullets,
  type Resume,
} from "@/lib/resume-schema";
import { moveArrayItem } from "@/lib/array-utils";
import { dedupeExperienceLocation } from "@/lib/experience-format";
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
  target?: "tailored" | "fixed" | "created";
}

export function ResumeInlineEditor({
  resume,
  target = "tailored",
}: ResumeInlineEditorProps) {
  const { updateTailoredResume, updateFixedResume, updateCreatedResume } =
    useResumeStore();

  const applyUpdate = (updater: (r: Resume) => Resume) => {
    if (target === "created") {
      updateCreatedResume(updater);
    } else if (target === "fixed") {
      updateFixedResume(updater);
    } else {
      updateTailoredResume((r) => updater(r ?? resume));
    }
  };

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
            applyUpdate((r) => ({ ...r, summary: e.target.value }))
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
                applyUpdate((r) => ({
                  ...r,
                  experience: moveArrayItem(r.experience, expIdx, expIdx - 1),
                }))
              }
              onMoveDown={() =>
                applyUpdate((r) => ({
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
                  applyUpdate((r) => {
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
                  applyUpdate((r) => {
                    const experience = [...r.experience];
                    const deduped = dedupeExperienceLocation(
                      e.target.value,
                      exp.location ?? ""
                    );
                    experience[expIdx] = {
                      ...exp,
                      company: deduped.company,
                      location: deduped.location,
                    };
                    return { ...r, experience };
                  })
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Location</Label>
              <Input
                placeholder="e.g. Remote, Kuala Lumpur"
                value={exp.location ?? ""}
                onChange={(e) =>
                  applyUpdate((r) => {
                    const experience = [...r.experience];
                    const deduped = dedupeExperienceLocation(
                      exp.company,
                      e.target.value
                    );
                    experience[expIdx] = {
                      ...exp,
                      company: deduped.company,
                      location: deduped.location,
                    };
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
                applyUpdate((r) => {
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
                applyUpdate((r) => {
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
                applyUpdate((r) => {
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
                  applyUpdate((r) => {
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

      {resume.projects.map((proj, projIdx) => {
        const projectBullets =
          proj.bullets?.length > 0 ? proj.bullets : getProjectBullets(proj);
        return (
        <SectionBlock
          key={proj.id}
          title={proj.name.trim() || `Project ${projIdx + 1}`}
        >
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Project Name</Label>
            <Input
              value={proj.name}
              onChange={(e) =>
                applyUpdate((r) => {
                  const projects = [...r.projects];
                  projects[projIdx] = { ...proj, name: e.target.value };
                  return { ...r, projects };
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              What the project does
            </Label>
            {projectBullets.map((bullet, bulletIdx) => (
              <Textarea
                key={bulletIdx}
                rows={2}
                value={bullet}
                onChange={(e) =>
                  applyUpdate((r) => {
                    const projects = [...r.projects];
                    const current = projects[projIdx];
                    const bullets = [
                      ...(current.bullets?.length
                        ? current.bullets
                        : getProjectBullets(current)),
                    ];
                    bullets[bulletIdx] = e.target.value;
                    projects[projIdx] = {
                      ...current,
                      bullets,
                      description: projectDescriptionFromBullets(bullets),
                    };
                    return { ...r, projects };
                  })
                }
              />
            ))}
          </div>
          <StringListField
            label="Tech stack"
            placeholder="e.g. React"
            values={proj.technologies ?? []}
            onChange={(technologies) =>
              applyUpdate((r) => {
                const projects = [...r.projects];
                projects[projIdx] = { ...proj, technologies };
                return { ...r, projects };
              })
            }
          />
        </SectionBlock>
        );
      })}

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
                  applyUpdate((r) => {
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
                  applyUpdate((r) => {
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
                  applyUpdate((r) => {
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

      <StringListField
        label="Skills"
        placeholder="e.g. TypeScript"
        values={resume.skills}
        onChange={(skills) =>
          applyUpdate((r) => ({ ...r, skills }))
        }
      />

      <LanguageListField
        label="Languages"
        values={resume.languages}
        onChange={(languages) =>
          applyUpdate((r) => ({ ...r, languages }))
        }
      />

      {resume.customSections.map((section, secIdx) => (
        <SectionBlock key={section.id} title={`${section.title || `Section ${secIdx + 1}`}`}>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Section Title</Label>
            <Input
              value={section.title}
              onChange={(e) =>
                applyUpdate((r) => {
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
                applyUpdate((r) => {
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
