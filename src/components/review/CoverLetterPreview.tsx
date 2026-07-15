"use client";

import type { ResumeHeader } from "@/lib/resume-schema";
import {
  CoverLetterCanvas,
  type CoverLetterCanvasProps,
} from "./CoverLetterCanvas";

interface CoverLetterPreviewProps {
  header: ResumeHeader;
  company: string;
  role: string;
  body: string;
  className?: string;
  hideEmptyRecipient?: boolean;
}

/** Read-only cover letter layout (matches PDF). */
export function CoverLetterPreview({
  header,
  company,
  role,
  body,
  className,
  hideEmptyRecipient,
}: CoverLetterPreviewProps) {
  return (
    <CoverLetterCanvas
      header={header}
      company={company}
      role={role}
      body={body}
      className={className}
      hideEmptyRecipient={hideEmptyRecipient}
    />
  );
}

export type { CoverLetterCanvasProps };
