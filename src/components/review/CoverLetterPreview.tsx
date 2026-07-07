"use client";

import type { ResumeHeader } from "@/lib/resume-schema";
import { ResumeHeaderBlock } from "@/components/resume/ResumeHeaderBlock";
import { formatDisplayName } from "@/lib/format-name";
import { getCoverLetterGreeting } from "@/lib/resume-header";
import { cn } from "@/lib/utils";

interface CoverLetterPreviewProps {
  header: ResumeHeader;
  company: string;
  role: string;
  body: string;
  className?: string;
}

export function CoverLetterPreview({
  header,
  company,
  role,
  body,
  className,
}: CoverLetterPreviewProps) {
  const displayName = formatDisplayName(header.name);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const paragraphs = body.split(/\n\n+/).filter(Boolean);

  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-10 text-[13px] leading-[1.7] text-gray-900 shadow-sm",
        className
      )}
    >
      <ResumeHeaderBlock header={header} className="pb-2" />

      <p className="mt-4 text-gray-800">{today}</p>

      <div className="mt-6 text-gray-800">
        <p>Hiring Manager</p>
        <p>{company}</p>
      </div>

      <p className="mt-6 font-medium text-gray-800">Re: {role}</p>

      <p className="mt-6 text-gray-800">{getCoverLetterGreeting()}</p>

      <div className="mt-4 space-y-4 text-justify text-gray-800">
        {paragraphs.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      <div className="mt-8 text-gray-800">
        <p>Sincerely,</p>
        <p className="mt-1 font-bold">{displayName}</p>
      </div>
    </div>
  );
}
