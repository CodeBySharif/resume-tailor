"use client";

import type { ResumeHeader } from "@/lib/resume-schema";
import { ResumeHeaderBlock } from "@/components/resume/ResumeHeaderBlock";
import { formatDisplayName } from "@/lib/format-name";
import { getCoverLetterGreeting } from "@/lib/resume-header";
import { cn } from "@/lib/utils";

export interface CoverLetterCanvasProps {
  header: ResumeHeader;
  company: string;
  role: string;
  body: string;
  /** When true, company / role / body are editable on the letter layout. */
  editable?: boolean;
  onCompanyChange?: (value: string) => void;
  onRoleChange?: (value: string) => void;
  onBodyChange?: (value: string) => void;
  className?: string;
  /** Hide company / role lines when empty and not editing (standalone letters). */
  hideEmptyRecipient?: boolean;
}

const fieldClass =
  "w-full border-0 border-b border-transparent bg-transparent p-0 text-[13px] leading-[1.7] text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-300";

export function CoverLetterCanvas({
  header,
  company,
  role,
  body,
  editable = false,
  onCompanyChange,
  onRoleChange,
  onBodyChange,
  className,
  hideEmptyRecipient = false,
}: CoverLetterCanvasProps) {
  const displayName = formatDisplayName(header.name);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const paragraphs = body.split(/\n\n+/).filter(Boolean);
  const showRecipient =
    editable || !hideEmptyRecipient || Boolean(company.trim());
  const showSubject =
    editable || !hideEmptyRecipient || Boolean(role.trim());

  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-10 text-[13px] leading-[1.7] text-gray-900 shadow-sm",
        className
      )}
    >
      <ResumeHeaderBlock header={header} className="pb-2" />

      <p className="mt-4 text-gray-800">{today}</p>

      {showRecipient && (
        <div className="mt-6 text-gray-800">
          <p>Hiring Manager</p>
          {editable ? (
            <input
              type="text"
              aria-label="Company"
              placeholder="Company name"
              value={company}
              onChange={(e) => onCompanyChange?.(e.target.value)}
              className={cn(fieldClass, "mt-0")}
            />
          ) : (
            <p>{company}</p>
          )}
        </div>
      )}

      {showSubject && (
        <div className="mt-6 flex items-baseline gap-1 font-medium text-gray-800">
          <span className="shrink-0">Re:</span>
          {editable ? (
            <input
              type="text"
              aria-label="Role"
              placeholder="Role / position"
              value={role}
              onChange={(e) => onRoleChange?.(e.target.value)}
              className={cn(fieldClass, "font-medium")}
            />
          ) : (
            <span>{role}</span>
          )}
        </div>
      )}

      <p className="mt-6 text-gray-800">{getCoverLetterGreeting()}</p>

      {editable ? (
        <textarea
          aria-label="Cover letter body"
          rows={Math.max(8, paragraphs.length * 3 || 8)}
          placeholder="Write your cover letter body here. Separate paragraphs with a blank line."
          value={body}
          onChange={(e) => onBodyChange?.(e.target.value)}
          className={cn(
            fieldClass,
            "mt-4 min-h-[180px] resize-y border border-dashed border-gray-200 bg-gray-50/40 p-3 text-justify focus:border-gray-300 focus:bg-white"
          )}
        />
      ) : (
        <div className="mt-4 space-y-4 text-justify text-gray-800">
          {paragraphs.length > 0 ? (
            paragraphs.map((para, i) => <p key={i}>{para}</p>)
          ) : (
            <p className="text-gray-400 italic">No cover letter body yet.</p>
          )}
        </div>
      )}

      <div className="mt-8 text-gray-800">
        <p>Sincerely,</p>
        <p className="mt-1 font-bold">{displayName || "Your Name"}</p>
      </div>
    </div>
  );
}
