"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildExportFileName } from "@/lib/format-name";
import {
  CoverLetterPDFDocument,
  FreeformCoverLetterPDFDocument,
  ResumePDFDocument,
} from "@/lib/pdf-export";
import type { Resume } from "@/lib/resume-schema";
import type { CoverLetterMode } from "@/store/resume-store";

interface PdfDownloadButtonsProps {
  resume: Resume;
  coverLetter: string | null;
  company: string;
  role: string;
  coverLetterMode?: CoverLetterMode;
  /** When false, hide resume PDF button (cover-only flows). */
  showResume?: boolean;
  /** When false, hide cover letter PDF button. */
  showCover?: boolean;
}

type DownloadKind = "resume" | "cover-letter";

function sanitizeDownloadFileName(name: string): string {
  const cleaned = name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "document.pdf";
  return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
}

function stripPdfExtension(name: string): string {
  return name.replace(/\.pdf$/i, "");
}

export default function PdfDownloadButtons({
  resume,
  coverLetter,
  company,
  role,
  coverLetterMode = "templated",
  showResume = true,
  showCover = true,
}: PdfDownloadButtonsProps) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<DownloadKind>("resume");
  const [fileName, setFileName] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultResumeName = buildExportFileName(
    resume.header.name,
    company,
    "resume"
  );
  const defaultCoverName = buildExportFileName(
    resume.header.name,
    company,
    "cover-letter"
  );

  const canShowCover = showCover && Boolean(coverLetter?.trim());

  function openDialog(nextKind: DownloadKind) {
    setKind(nextKind);
    setFileName(
      stripPdfExtension(
        nextKind === "resume" ? defaultResumeName : defaultCoverName
      )
    );
    setError(null);
    setOpen(true);
  }

  async function handleDownload() {
    const finalName = sanitizeDownloadFileName(fileName);
    setDownloading(true);
    setError(null);

    try {
      const pdfDoc =
        kind === "resume" ? (
          <ResumePDFDocument resume={resume} />
        ) : coverLetterMode === "freeform" ? (
          <FreeformCoverLetterPDFDocument coverLetter={coverLetter ?? ""} />
        ) : (
          <CoverLetterPDFDocument
            coverLetter={coverLetter ?? ""}
            header={resume.header}
            company={company}
            role={role}
          />
        );

      const blob = await pdf(pdfDoc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = finalName;
      link.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create PDF");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <div className="flex shrink-0 flex-wrap gap-2">
        {showResume && (
          <Button
            size="sm"
            onClick={() => openDialog("resume")}
            className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            <Download className="size-4" />
            Resume PDF
          </Button>
        )}

        {canShowCover ? (
          <Button
            size="sm"
            variant={showResume ? "outline" : "default"}
            onClick={() => openDialog("cover-letter")}
            className={
              showResume
                ? undefined
                : "bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
            }
          >
            <FileText className="size-4" />
            Cover Letter PDF
          </Button>
        ) : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {kind === "resume" ? "Name resume PDF" : "Name cover letter PDF"}
            </DialogTitle>
            <DialogDescription>
              Choose a file name, then download. The .pdf extension is added
              automatically if missing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5 py-1">
            <Label htmlFor="pdf-file-name">File name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="pdf-file-name"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && fileName.trim() && !downloading) {
                    e.preventDefault();
                    void handleDownload();
                  }
                }}
                placeholder="My_Resume"
                autoFocus
                disabled={downloading}
              />
              <span className="shrink-0 text-sm text-muted-foreground">
                .pdf
              </span>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={downloading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleDownload()}
              disabled={!fileName.trim() || downloading}
              className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
            >
              <Download className="size-4" />
              {downloading ? "Preparing…" : "Download"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
