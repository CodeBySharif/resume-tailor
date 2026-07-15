"use client";

import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { FormSection } from "./FormSection";
import { MonthYearInput } from "./MonthYearInput";
import { ReorderButtons } from "./ReorderButtons";
import { ResumePreview } from "./ResumePreview";
import { createId, getProjectBullets, projectDescriptionFromBullets } from "@/lib/resume-schema";
import { moveArrayItem } from "@/lib/array-utils";
import { isPresentDate } from "@/lib/date-utils";
import { StringListField } from "@/components/ui/string-list-field";
import { LanguageListField } from "@/components/ui/language-list-field";
import { getResumeBuildMissingFields } from "@/lib/resume-validation";
import { useResumeStore } from "@/store/resume-store";

function ContinueRequirementsHint({
  missing,
}: {
  missing: string[];
}) {
  if (missing.length === 0) return null;
  return (
    <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
      To continue, fill in:{" "}
      <span className="font-medium">{missing.join(", ")}</span>
    </p>
  );
}

function EntryCard({
  title,
  onRemove,
  reorder,
  children,
}: {
  title: string;
  onRemove: () => void;
  reorder?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-foreground">{title}</span>
        <div className="flex items-center gap-0.5">
          {reorder}
          <Button variant="ghost" size="icon-xs" onClick={onRemove}>
            <Trash2 className="size-3 text-destructive" />
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}

export function ResumeEditor({
  title = "Edit Your Resume",
  description = "Review and refine your resume before tailoring",
  onBack,
  showContinueRequirements = false,
  embedded = false,
  allowContinueWithoutContact = false,
}: {
  title?: string;
  description?: string;
  onBack?: () => void;
  showContinueRequirements?: boolean;
  /** Hide the top Back/Continue bar (parent provides navigation). */
  embedded?: boolean;
  /** Allow Continue without name/email (e.g. cover-letter-only edit flows). */
  allowContinueWithoutContact?: boolean;
} = {}) {
  const { resume, updateResume, prevStep, nextStep } = useResumeStore();

  const missingRequired = showContinueRequirements
    ? getResumeBuildMissingFields(resume)
    : [];

  const canContinue = allowContinueWithoutContact
    ? true
    : showContinueRequirements
      ? missingRequired.length === 0
      : Boolean(resume.header.name.trim() && resume.header.email.trim());

  const req = showContinueRequirements ? " *" : "";

  const handleBack = onBack ?? prevStep;

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ChevronLeft className="size-4" />
              Back
            </Button>
            <Button
              size="sm"
              disabled={!canContinue}
              onClick={nextStep}
              className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
            >
              Continue
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {showContinueRequirements && !canContinue && !embedded && (
        <ContinueRequirementsHint missing={missingRequired} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-1 py-1 pr-2">
          <FormSection title={`Header${req}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={resume.header.name}
                  onChange={(e) =>
                    updateResume((r) => ({
                      ...r,
                      header: { ...r.header, name: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-medium text-muted-foreground">
                  Professional Title
                </Label>
                <Input
                  id="title"
                  value={resume.header.title}
                  onChange={(e) =>
                    updateResume((r) => ({
                      ...r,
                      header: { ...r.header, title: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={resume.header.email}
                  onChange={(e) =>
                    updateResume((r) => ({
                      ...r,
                      header: { ...r.header, email: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={resume.header.phone}
                  onChange={(e) =>
                    updateResume((r) => ({
                      ...r,
                      header: { ...r.header, phone: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-medium text-muted-foreground">
                  City
                </Label>
                <Input
                  id="city"
                  value={resume.header.city}
                  onChange={(e) =>
                    updateResume((r) => ({
                      ...r,
                      header: { ...r.header, city: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="linkedin" className="text-xs font-medium text-muted-foreground">
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  value={resume.header.linkedin ?? ""}
                  onChange={(e) =>
                    updateResume((r) => ({
                      ...r,
                      header: { ...r.header, linkedin: e.target.value },
                    }))
                  }
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={resume.header.showLinkedin ?? false}
                    onCheckedChange={(checked) =>
                      updateResume((r) => ({
                        ...r,
                        header: {
                          ...r.header,
                          showLinkedin: checked === true,
                        },
                      }))
                    }
                  />
                  Show on resume
                </label>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="portfolio" className="text-xs font-medium text-muted-foreground">
                  Portfolio / Website
                </Label>
                <Input
                  id="portfolio"
                  value={resume.header.portfolio ?? ""}
                  onChange={(e) =>
                    updateResume((r) => ({
                      ...r,
                      header: { ...r.header, portfolio: e.target.value },
                    }))
                  }
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={resume.header.showPortfolio ?? false}
                    onCheckedChange={(checked) =>
                      updateResume((r) => ({
                        ...r,
                        header: {
                          ...r.header,
                          showPortfolio: checked === true,
                        },
                      }))
                    }
                  />
                  Show on resume
                </label>
              </div>
            </div>
          </FormSection>

          <Separator />

          <FormSection title={`Professional Summary${req}`}>
            <div className="space-y-1.5">
              <Label htmlFor="summary" className="text-xs font-medium text-muted-foreground">
                Summary{req}
              </Label>
              <Textarea
                id="summary"
                rows={4}
                value={resume.summary}
                onChange={(e) =>
                  updateResume((r) => ({ ...r, summary: e.target.value }))
                }
              />
            </div>
          </FormSection>

          <Separator />

          <FormSection
            title={`Work Experience${req}`}
            action={
              <Button
                variant="outline"
                size="xs"
                onClick={() =>
                  updateResume((r) => ({
                    ...r,
                    experience: [
                      {
                        id: createId(),
                        company: "",
                        role: "",
                        location: "",
                        startDate: "",
                        endDate: "",
                        bullets: [""],
                      },
                      ...r.experience,
                    ],
                  }))
                }
              >
                <Plus className="size-3" />
                Add
              </Button>
            }
          >
            <div className="space-y-3">
              {resume.experience.length === 0 && (
                <p className="text-sm text-muted-foreground">No experience added yet.</p>
              )}
              {resume.experience.map((exp, expIdx) => {
                const isCurrent = isPresentDate(exp.endDate);
                return (
                  <EntryCard
                    key={exp.id}
                    title={`Experience ${expIdx + 1}`}
                    reorder={
                      <ReorderButtons
                        index={expIdx}
                        total={resume.experience.length}
                        onMoveUp={() =>
                          updateResume((r) => ({
                            ...r,
                            experience: moveArrayItem(
                              r.experience,
                              expIdx,
                              expIdx - 1
                            ),
                          }))
                        }
                        onMoveDown={() =>
                          updateResume((r) => ({
                            ...r,
                            experience: moveArrayItem(
                              r.experience,
                              expIdx,
                              expIdx + 1
                            ),
                          }))
                        }
                      />
                    }
                    onRemove={() =>
                      updateResume((r) => ({
                        ...r,
                        experience: r.experience.filter((e) => e.id !== exp.id),
                      }))
                    }
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Role</Label>
                        <Input
                          value={exp.role}
                          onChange={(e) =>
                            updateResume((r) => {
                              const experience = [...r.experience];
                              experience[expIdx] = { ...exp, role: e.target.value };
                              return { ...r, experience };
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Company</Label>
                        <Input
                          value={exp.company}
                          onChange={(e) =>
                            updateResume((r) => {
                              const experience = [...r.experience];
                              experience[expIdx] = { ...exp, company: e.target.value };
                              return { ...r, experience };
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs font-medium text-muted-foreground">Location</Label>
                        <Input
                          value={exp.location ?? ""}
                          onChange={(e) =>
                            updateResume((r) => {
                              const experience = [...r.experience];
                              experience[expIdx] = { ...exp, location: e.target.value };
                              return { ...r, experience };
                            })
                          }
                        />
                      </div>
                      <MonthYearInput
                        id={`exp-start-${exp.id}`}
                        label="Start Date"
                        value={exp.startDate}
                        onChange={(v) =>
                          updateResume((r) => {
                            const experience = [...r.experience];
                            experience[expIdx] = { ...exp, startDate: v };
                            return { ...r, experience };
                          })
                        }
                      />
                      <MonthYearInput
                        id={`exp-end-${exp.id}`}
                        label="End Date"
                        value={isCurrent ? "" : exp.endDate}
                        disabled={isCurrent}
                        onChange={(v) =>
                          updateResume((r) => {
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
                          updateResume((r) => {
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
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Achievements
                      </Label>
                      {exp.bullets.map((bullet, bulletIdx) => (
                        <div key={bulletIdx} className="flex gap-2">
                          <Textarea
                            rows={2}
                            value={bullet}
                            className="flex-1"
                            onChange={(e) =>
                              updateResume((r) => {
                                const experience = [...r.experience];
                                const bullets = [...exp.bullets];
                                bullets[bulletIdx] = e.target.value;
                                experience[expIdx] = { ...exp, bullets };
                                return { ...r, experience };
                              })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                              updateResume((r) => {
                                const experience = [...r.experience];
                                const bullets = exp.bullets.filter((_, i) => i !== bulletIdx);
                                experience[expIdx] = { ...exp, bullets };
                                return { ...r, experience };
                              })
                            }
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() =>
                          updateResume((r) => {
                            const experience = [...r.experience];
                            experience[expIdx] = {
                              ...exp,
                              bullets: [...exp.bullets, ""],
                            };
                            return { ...r, experience };
                          })
                        }
                      >
                        <Plus className="size-3" />
                        Add bullet
                      </Button>
                    </div>
                  </EntryCard>
                );
              })}
            </div>
          </FormSection>

          <Separator />

          <FormSection
            title="Project Highlights"
            action={
              <Button
                variant="outline"
                size="xs"
                onClick={() =>
                  updateResume((r) => ({
                    ...r,
                    projects: [
                      ...r.projects,
                      {
                        id: createId(),
                        name: "",
                        bullets: [""],
                        description: "",
                        technologies: [],
                        url: "",
                      },
                    ],
                  }))
                }
              >
                <Plus className="size-3" />
                Add
              </Button>
            }
          >
            <div className="space-y-3">
              {resume.projects.map((proj, projIdx) => {
                const projectBullets =
                  proj.bullets?.length > 0
                    ? proj.bullets
                    : getProjectBullets(proj);
                return (
                <EntryCard
                  key={proj.id}
                  title={proj.name.trim() || `Project ${projIdx + 1}`}
                  onRemove={() =>
                    updateResume((r) => ({
                      ...r,
                      projects: r.projects.filter((p) => p.id !== proj.id),
                    }))
                  }
                >
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Project Name
                      </Label>
                      <Input
                        value={proj.name}
                        onChange={(e) =>
                          updateResume((r) => {
                            const projects = [...r.projects];
                            projects[projIdx] = { ...proj, name: e.target.value };
                            return { ...r, projects };
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">
                        What the project does
                      </Label>
                      {projectBullets.map((bullet, bulletIdx) => (
                        <div key={bulletIdx} className="flex gap-2">
                          <Textarea
                            rows={2}
                            value={bullet}
                            className="flex-1"
                            placeholder="Describe an outcome or responsibility"
                            onChange={(e) =>
                              updateResume((r) => {
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
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() =>
                              updateResume((r) => {
                                const projects = [...r.projects];
                                const current = projects[projIdx];
                                const bullets = (
                                  current.bullets?.length
                                    ? current.bullets
                                    : getProjectBullets(current)
                                ).filter((_, i) => i !== bulletIdx);
                                projects[projIdx] = {
                                  ...current,
                                  bullets,
                                  description: projectDescriptionFromBullets(bullets),
                                };
                                return { ...r, projects };
                              })
                            }
                          >
                            <Trash2 className="size-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() =>
                          updateResume((r) => {
                            const projects = [...r.projects];
                            const current = projects[projIdx];
                            const bullets = [
                              ...(current.bullets?.length
                                ? current.bullets
                                : getProjectBullets(current)),
                              "",
                            ];
                            projects[projIdx] = {
                              ...current,
                              bullets,
                              description: projectDescriptionFromBullets(bullets),
                            };
                            return { ...r, projects };
                          })
                        }
                      >
                        <Plus className="size-3" />
                        Add bullet
                      </Button>
                    </div>
                    <StringListField
                      label="Tech stack"
                      placeholder="e.g. React"
                      values={proj.technologies ?? []}
                      onChange={(technologies) =>
                        updateResume((r) => {
                          const projects = [...r.projects];
                          projects[projIdx] = { ...proj, technologies };
                          return { ...r, projects };
                        })
                      }
                    />
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        URL (optional)
                      </Label>
                      <Input
                        value={proj.url ?? ""}
                        onChange={(e) =>
                          updateResume((r) => {
                            const projects = [...r.projects];
                            projects[projIdx] = { ...proj, url: e.target.value };
                            return { ...r, projects };
                          })
                        }
                      />
                    </div>
                  </div>
                </EntryCard>
                );
              })}
            </div>
          </FormSection>

          <Separator />

          <FormSection
            title={`Education${req}`}
            action={
              <Button
                variant="outline"
                size="xs"
                onClick={() =>
                  updateResume((r) => ({
                    ...r,
                    education: [
                      ...r.education,
                      {
                        id: createId(),
                        institution: "",
                        degree: "",
                        field: "",
                        startDate: "",
                        endDate: "",
                        gpa: "",
                      },
                    ],
                  }))
                }
              >
                <Plus className="size-3" />
                Add
              </Button>
            }
          >
            <div className="space-y-3">
              {resume.education.map((edu, eduIdx) => (
                <EntryCard
                  key={edu.id}
                  title={`Education ${eduIdx + 1}`}
                  onRemove={() =>
                    updateResume((r) => ({
                      ...r,
                      education: r.education.filter((e) => e.id !== edu.id),
                    }))
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-medium text-muted-foreground">Institution</Label>
                      <Input
                        value={edu.institution}
                        onChange={(e) =>
                          updateResume((r) => {
                            const education = [...r.education];
                            education[eduIdx] = { ...edu, institution: e.target.value };
                            return { ...r, education };
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Degree</Label>
                      <Input
                        value={edu.degree}
                        onChange={(e) =>
                          updateResume((r) => {
                            const education = [...r.education];
                            education[eduIdx] = { ...edu, degree: e.target.value };
                            return { ...r, education };
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Field of Study</Label>
                      <Input
                        value={edu.field ?? ""}
                        onChange={(e) =>
                          updateResume((r) => {
                            const education = [...r.education];
                            education[eduIdx] = { ...edu, field: e.target.value };
                            return { ...r, education };
                          })
                        }
                      />
                    </div>
                    <MonthYearInput
                      id={`edu-start-${edu.id}`}
                      label="Start Date"
                      value={edu.startDate}
                      onChange={(v) =>
                        updateResume((r) => {
                          const education = [...r.education];
                          education[eduIdx] = { ...edu, startDate: v };
                          return { ...r, education };
                        })
                      }
                    />
                    <MonthYearInput
                      id={`edu-end-${edu.id}`}
                      label="End Date"
                      value={edu.endDate}
                      onChange={(v) =>
                        updateResume((r) => {
                          const education = [...r.education];
                          education[eduIdx] = { ...edu, endDate: v };
                          return { ...r, education };
                        })
                      }
                    />
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">GPA (optional)</Label>
                      <Input
                        value={edu.gpa ?? ""}
                        onChange={(e) =>
                          updateResume((r) => {
                            const education = [...r.education];
                            education[eduIdx] = { ...edu, gpa: e.target.value };
                            return { ...r, education };
                          })
                        }
                      />
                    </div>
                  </div>
                </EntryCard>
              ))}
            </div>
          </FormSection>

          <Separator />

          <FormSection title="Skills">
            <StringListField
              id="skills"
              label="Skills"
              placeholder="e.g. TypeScript"
              values={resume.skills}
              onChange={(skills) => updateResume((r) => ({ ...r, skills }))}
            />
          </FormSection>

          <FormSection title="Languages">
            <LanguageListField
              id="languages"
              label="Languages"
              values={resume.languages}
              onChange={(languages) => updateResume((r) => ({ ...r, languages }))}
            />
          </FormSection>

          <Separator />

          <FormSection
            title="Custom Sections"
            description="Career breaks, certifications, volunteer work, etc."
            action={
              <Button
                variant="outline"
                size="xs"
                onClick={() =>
                  updateResume((r) => ({
                    ...r,
                    customSections: [
                      ...r.customSections,
                      { id: createId(), title: "", content: "" },
                    ],
                  }))
                }
              >
                <Plus className="size-3" />
                Add Section
              </Button>
            }
          >
            <div className="space-y-3">
              {resume.customSections.map((section, secIdx) => (
                <EntryCard
                  key={section.id}
                  title={`Custom Section ${secIdx + 1}`}
                  onRemove={() =>
                    updateResume((r) => ({
                      ...r,
                      customSections: r.customSections.filter((s) => s.id !== section.id),
                    }))
                  }
                >
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Section Name</Label>
                      <Input
                        value={section.title}
                        onChange={(e) =>
                          updateResume((r) => {
                            const customSections = [...r.customSections];
                            customSections[secIdx] = { ...section, title: e.target.value };
                            return { ...r, customSections };
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Content</Label>
                      <Textarea
                        rows={4}
                        value={section.content}
                        onChange={(e) =>
                          updateResume((r) => {
                            const customSections = [...r.customSections];
                            customSections[secIdx] = { ...section, content: e.target.value };
                            return { ...r, customSections };
                          })
                        }
                      />
                    </div>
                  </div>
                </EntryCard>
              ))}
            </div>
          </FormSection>
        </div>

        <div className="lg:sticky lg:top-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Live Preview
          </p>
          <ResumePreview resume={resume} className="max-h-[70vh] overflow-y-auto" />
        </div>
      </div>
    </div>
  );
}
