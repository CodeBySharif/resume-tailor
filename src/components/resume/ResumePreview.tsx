"use client";

import type { Resume } from "@/lib/resume-schema";
import { getProjectBullets } from "@/lib/resume-schema";
import { formatExperienceCompanyLine } from "@/lib/experience-format";
import { formatDateRange } from "@/lib/date-utils";
import { RESUME_SPACE_EM } from "@/lib/resume-spacing";
import { ResumeHeaderBlock } from "./ResumeHeaderBlock";
import { cn } from "@/lib/utils";

interface ResumePreviewProps {
  resume: Resume;
  className?: string;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-gray-400 text-[11pt] font-bold uppercase leading-none tracking-wider">
      {children}
    </h3>
  );
}

function ResumeSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: RESUME_SPACE_EM.afterSection }}>
      <SectionHeading>{title}</SectionHeading>
      <div style={{ marginTop: RESUME_SPACE_EM.afterHeader }}>{children}</div>
    </section>
  );
}

function ContentBlock({
  spaced,
  children,
}: {
  spaced?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={spaced ? { marginTop: RESUME_SPACE_EM.betweenContent } : undefined}>
      {children}
    </div>
  );
}

function EntryBlock({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={
        index > 0 ? { marginTop: RESUME_SPACE_EM.betweenContent } : undefined
      }
    >
      {children}
    </div>
  );
}

export function ResumePreview({ resume, className }: ResumePreviewProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-8 text-[10pt] leading-tight text-gray-900 shadow-sm",
        className
      )}
    >
      <ResumeHeaderBlock header={resume.header} />

      {resume.summary && (
        <ResumeSection title="Professional Summary">
          <p className="text-justify">{resume.summary}</p>
        </ResumeSection>
      )}

      {resume.experience.length > 0 && (
        <ResumeSection title="Experience">
          {resume.experience.map((exp, index) => (
            <EntryBlock key={exp.id} index={index}>
              <ContentBlock>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10pt] font-semibold leading-none">
                    {exp.role}
                  </span>
                  <span className="shrink-0 text-[9pt] leading-none text-gray-600">
                    {formatDateRange(exp.startDate, exp.endDate)}
                  </span>
                </div>
              </ContentBlock>
              <ContentBlock spaced>
                <p className="leading-tight text-gray-700">
                  {formatExperienceCompanyLine(exp.company, exp.location)}
                </p>
              </ContentBlock>
              <ContentBlock spaced>
                <ul className="list-disc pl-4">
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} className="leading-tight">
                      {b}
                    </li>
                  ))}
                </ul>
              </ContentBlock>
            </EntryBlock>
          ))}
        </ResumeSection>
      )}

      {resume.projects.length > 0 && (
        <ResumeSection title="Projects">
          {resume.projects.map((proj, index) => {
            const bullets = getProjectBullets(proj).filter(Boolean);
            return (
            <EntryBlock key={proj.id} index={index}>
              <ContentBlock>
                <p className="text-[10pt] font-semibold leading-none">
                  {proj.name}
                </p>
              </ContentBlock>
              {bullets.length > 0 && (
                <ContentBlock spaced>
                  <ul className="list-disc space-y-0.5 pl-4">
                    {bullets.map((bullet, i) => (
                      <li key={i} className="leading-tight">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </ContentBlock>
              )}
              {proj.technologies && proj.technologies.length > 0 && (
                <ContentBlock spaced>
                  <div className="flex flex-wrap gap-1">
                    {proj.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded bg-gray-100 px-1.5 py-0.5 text-[8.5pt] leading-tight text-gray-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </ContentBlock>
              )}
            </EntryBlock>
            );
          })}
        </ResumeSection>
      )}

      {resume.education.length > 0 && (
        <ResumeSection title="Education">
          {resume.education.map((edu, index) => (
            <EntryBlock key={edu.id} index={index}>
              <ContentBlock>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10pt] font-semibold leading-none">
                    {edu.degree}
                    {edu.field ? ` in ${edu.field}` : ""}
                  </span>
                  <span className="shrink-0 text-[9pt] leading-none text-gray-600">
                    {formatDateRange(edu.startDate, edu.endDate)}
                  </span>
                </div>
              </ContentBlock>
              <ContentBlock spaced>
                <p className="leading-tight text-gray-700">
                  {edu.institution}
                  {edu.gpa ? ` | GPA: ${edu.gpa}` : ""}
                </p>
              </ContentBlock>
            </EntryBlock>
          ))}
        </ResumeSection>
      )}

      {resume.skills.length > 0 && (
        <ResumeSection title="Skills">
          <p>{resume.skills.join(" • ")}</p>
        </ResumeSection>
      )}

      {resume.languages.length > 0 && (
        <ResumeSection title="Languages">
          <p>{resume.languages.join(" • ")}</p>
        </ResumeSection>
      )}

      {resume.customSections.map((section) => (
        <ResumeSection key={section.id} title={section.title}>
          <p className="whitespace-pre-wrap">{section.content}</p>
        </ResumeSection>
      ))}
    </div>
  );
}
