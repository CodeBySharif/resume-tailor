"use client";

import { Download, FileText } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { buildExportFileName } from "@/lib/format-name";
import {
  CoverLetterPDFDocument,
  ResumePDFDocument,
} from "@/lib/pdf-export";
import type { Resume } from "@/lib/resume-schema";

interface PdfDownloadButtonsProps {
  resume: Resume;
  coverLetter: string | null;
  company: string;
  role: string;
}

export default function PdfDownloadButtons({
  resume,
  coverLetter,
  company,
  role,
}: PdfDownloadButtonsProps) {
  const resumeFileName = buildExportFileName(
    resume.header.name,
    company,
    "resume"
  );
  const coverFileName = buildExportFileName(
    resume.header.name,
    company,
    "cover-letter"
  );

  return (
    <div className="flex shrink-0 flex-wrap gap-2">
      <PDFDownloadLink
        document={<ResumePDFDocument resume={resume} />}
        fileName={resumeFileName}
      >
        {({ loading }) => (
          <Button
            size="sm"
            disabled={loading}
            className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            <Download className="size-4" />
            {loading ? "Preparing…" : "Resume PDF"}
          </Button>
        )}
      </PDFDownloadLink>

      {coverLetter ? (
        <PDFDownloadLink
          document={
            <CoverLetterPDFDocument
              coverLetter={coverLetter}
              header={resume.header}
              company={company}
              role={role}
            />
          }
          fileName={coverFileName}
        >
          {({ loading }) => (
            <Button size="sm" variant="outline" disabled={loading}>
              <FileText className="size-4" />
              {loading ? "Preparing…" : "Cover Letter PDF"}
            </Button>
          )}
        </PDFDownloadLink>
      ) : null}
    </div>
  );
}
