"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PdfPagePreview } from "@/components/resume/PdfPagePreview";
import { StepShell } from "@/components/wizard/StepShell";
import { readJsonResponse } from "@/lib/api-response";
import {
  mergeCoverLetterHeader,
  parseCoverLetterUpload,
} from "@/lib/parse-cover-letter";
import { createEmptyResume, normalizeResume } from "@/lib/resume-schema";
import { stripCoverLetterSignature } from "@/lib/resume-header";
import { useResumeStore } from "@/store/resume-store";

export function EditCoverUploadStep() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const {
    resume,
    masterResume,
    coverLetter,
    setResume,
    setCoverLetter,
    setCoverLetterMode,
    updateJobDetails,
    goToLanding,
    nextStep,
  } = useResumeStore();

  const canContinue = ready || Boolean(coverLetter.trim());

  async function handlePdfUpload(file: File) {
    setLocalError(null);
    setUploading(true);
    setSelectedFile(file);
    setReady(false);

    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch("/api/extract-pdf-text", {
        method: "POST",
        body: form,
      });

      const data = await readJsonResponse<{ text?: string; error?: string }>(
        response
      );
      if (!response.ok) {
        throw new Error(data.error || "Failed to read PDF");
      }
      if (!data.text?.trim()) {
        throw new Error("Could not extract text from PDF");
      }

      const parsed = parseCoverLetterUpload(data.text);
      const fallbackHeader =
        masterResume?.header ??
        (resume.header.name.trim() ? resume.header : null);
      const header = mergeCoverLetterHeader(parsed.header, fallbackHeader);

      setResume(
        normalizeResume({
          ...createEmptyResume(),
          ...resume,
          header,
        })
      );
      setCoverLetter(
        stripCoverLetterSignature(parsed.body) || parsed.body.trim()
      );
      updateJobDetails({
        company: parsed.company,
        role: parsed.role,
      });
      setCoverLetterMode("templated");
      setReady(true);
    } catch (err) {
      setSelectedFile(null);
      setLocalError(
        err instanceof Error ? err.message : "Cover letter upload failed"
      );
    } finally {
      setUploading(false);
    }
  }

  function handleContinue() {
    if (!coverLetter.trim()) return;
    setCoverLetterMode("templated");
    nextStep();
  }

  return (
    <StepShell
      title="Edit Cover Letter"
      description="Upload a cover letter PDF — we'll place it into the formatted letter layout for editing"
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={goToLanding}
            disabled={uploading}
          >
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button
            size="sm"
            disabled={!canContinue || uploading}
            onClick={handleContinue}
            className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
          >
            Continue
            <ChevronRight className="size-4" />
          </Button>
        </>
      }
    >
      <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
        <PdfPagePreview file={selectedFile} size="sm" />

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handlePdfUpload(file);
            e.target.value = "";
          }}
        />

        <Button
          className="w-full bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileUp className="size-4" />
          )}
          {uploading ? "Reading PDF…" : "Upload cover letter PDF"}
        </Button>

        {ready && !uploading && (
          <p className="text-center text-xs text-muted-foreground">
            Loaded into letter format — continue to edit
          </p>
        )}

        {localError && (
          <p className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {localError}
          </p>
        )}
      </div>
    </StepShell>
  );
}
