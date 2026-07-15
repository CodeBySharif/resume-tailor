"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  ArrowRight,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { ResumeInlineEditor } from "./ResumeInlineEditor";
import { ReviewHeaderEditor } from "./ReviewHeaderEditor";
import { CoverLetterCanvas } from "./CoverLetterCanvas";
import {
  stripCoverLetterSignature,
} from "@/lib/resume-header";
import { normalizeResume } from "@/lib/resume-schema";
import { useResumeStore } from "@/store/resume-store";
import { AiContentDisclaimer } from "@/components/ui/ai-content-disclaimer";

const PdfDownloadButtons = dynamic(
  () => import("./PdfDownloadButtons"),
  {
    ssr: false,
    loading: () => (
      <div className="flex gap-2">
        <Button disabled size="sm">
          Loading PDF…
        </Button>
      </div>
    ),
  }
);

export function ReviewStep() {
  const [editingCover, setEditingCover] = useState(false);
  const [editingResume, setEditingResume] = useState(false);

  const {
    originalResume,
    tailoredResume,
    coverLetter,
    changes,
    jobDetails,
    setCoverLetter,
    updateJobDetails,
    setStep,
    resetAll,
  } = useResumeStore();

  const displayResume = normalizeResume(tailoredResume ?? originalResume ?? {});

  if (!displayResume.header.name && !displayResume.experience.length) {
    return (
      <p className="text-muted-foreground">No tailored resume available.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Review & Download</h2>
          <p className="text-sm text-muted-foreground">
            Review changes, edit if needed, and download ATS-friendly PDFs
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setStep(3)}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button variant="outline" size="sm" onClick={resetAll}>
            Start Over
          </Button>
        </div>
      </div>

      <AiContentDisclaimer compact className="mb-2" />

      <Tabs defaultValue="preview">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="preview">Tailored Resume</TabsTrigger>
            <TabsTrigger value="cover">Cover Letter</TabsTrigger>
            {originalResume && (
              <TabsTrigger value="original">Original</TabsTrigger>
            )}
            <TabsTrigger value="changes">
              What Changed
              {changes.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {changes.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <PdfDownloadButtons
            resume={displayResume}
            coverLetter={coverLetter || null}
            company={jobDetails.company}
            role={jobDetails.role}
            coverLetterMode="templated"
          />
        </div>

        <TabsContent value="preview" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingResume(!editingResume)}
            >
              <Pencil className="size-4" />
              {editingResume ? "Done Editing" : "Edit Resume"}
            </Button>
          </div>
          {editingResume ? (
            <div className="space-y-4">
              <ReviewHeaderEditor target="tailored" />
              {tailoredResume ? (
                <ResumeInlineEditor resume={tailoredResume} target="tailored" />
              ) : null}
            </div>
          ) : null}
          <ResumePreview resume={displayResume} />
        </TabsContent>

        <TabsContent value="changes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>What Changed</CardTitle>
              <CardDescription>
                AI-tailored modifications for {jobDetails.role}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {changes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No detailed change log available.
                </p>
              ) : (
                changes.map((change, i) => (
                  <div key={i} className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{change.section}</Badge>
                      <span>{change.field}</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          Before
                        </p>
                        <p className="rounded bg-red-50 p-2 text-sm text-red-900 dark:bg-red-950/30 dark:text-red-200">
                          {change.before}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <ArrowRight className="mt-3 hidden size-4 shrink-0 text-muted-foreground sm:block" />
                        <div className="flex-1">
                          <p className="mb-1 text-xs font-medium text-muted-foreground">
                            After
                          </p>
                          <p className="rounded bg-green-50 p-2 text-sm text-green-900 dark:bg-green-950/30 dark:text-green-200">
                            {change.after}
                          </p>
                        </div>
                      </div>
                    </div>
                    {i < changes.length - 1 && <Separator />}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cover" className="mt-4 space-y-4">
          <div className="flex justify-end gap-2">
            {editingCover && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingCover(false)}
              >
                Done Editing
              </Button>
            )}
            {!editingCover && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingCover(true)}
              >
                <Pencil className="size-4" />
                Edit Cover Letter
              </Button>
            )}
          </div>
          {editingCover && (
            <ReviewHeaderEditor target="tailored" />
          )}
          <CoverLetterCanvas
            header={displayResume.header}
            company={jobDetails.company}
            role={jobDetails.role}
            body={stripCoverLetterSignature(coverLetter)}
            editable={editingCover}
            onCompanyChange={(company) => updateJobDetails({ company })}
            onRoleChange={(role) => updateJobDetails({ role })}
            onBodyChange={setCoverLetter}
          />
        </TabsContent>

        {originalResume && (
          <TabsContent value="original" className="mt-4">
            <ResumePreview resume={originalResume} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
