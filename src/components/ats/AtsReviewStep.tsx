"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { fetchGeneralAtsCheck } from "@/lib/ats-client";
import { AtsScoreComparison } from "@/components/ats/AtsScoreComparison";
import { Button } from "@/components/ui/button";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { ResumeInlineEditor } from "@/components/review/ResumeInlineEditor";
import { ReviewHeaderEditor } from "@/components/review/ReviewHeaderEditor";
import { normalizeResume } from "@/lib/resume-schema";
import { useResumeStore } from "@/store/resume-store";

const PdfDownloadButtons = dynamic(
  () => import("@/components/review/PdfDownloadButtons"),
  {
    ssr: false,
    loading: () => (
      <Button disabled size="sm">
        Loading PDF…
      </Button>
    ),
  }
);

export function AtsReviewStep() {
  const [editingResume, setEditingResume] = useState(false);
  const [showPriorities, setShowPriorities] = useState(false);
  const scoreFetchRef = useRef(0);

  const {
    fixedResume,
    atsResult,
    fixedAtsResult,
    fixedAtsChecking,
    llmSettings,
    setFixedAtsResult,
    setFixedAtsChecking,
    resetAll,
    prevStep,
  } = useResumeStore();

  const displayResume = normalizeResume(fixedResume ?? {});

  useEffect(() => {
    if (!fixedResume || !atsResult || fixedAtsResult || fixedAtsChecking) return;

    const fetchId = ++scoreFetchRef.current;
    setFixedAtsChecking(true);

    void fetchGeneralAtsCheck(fixedResume, llmSettings)
      .then((result) => {
        if (fetchId !== scoreFetchRef.current) return;
        setFixedAtsResult(result);
      })
      .catch(() => {
        /* keep before score only */
      })
      .finally(() => {
        if (fetchId === scoreFetchRef.current) {
          setFixedAtsChecking(false);
        }
      });

    return () => {
      scoreFetchRef.current += 1;
    };
  }, [
    fixedResume,
    atsResult,
    fixedAtsResult,
    fixedAtsChecking,
    llmSettings,
    setFixedAtsResult,
    setFixedAtsChecking,
  ]);

  if (!fixedResume) {
    return (
      <p className="text-muted-foreground">
        No improved resume available. Go back and generate one.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Your improved resume</h2>
          <p className="text-sm text-muted-foreground">
            Review, edit if needed, and download your ATS-friendly PDF
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={prevStep}>
            <ChevronLeft className="size-4" />
            Back
          </Button>
          <Button variant="outline" size="sm" onClick={resetAll}>
            Start Over
          </Button>
          <PdfDownloadButtons
            resume={displayResume}
            coverLetter={null}
            company=""
            role=""
          />
        </div>
      </div>

      {atsResult && (
        <div className="space-y-3">
          <AtsScoreComparison
            before={atsResult}
            after={fixedAtsResult}
            loading={fixedAtsChecking}
          />

          {atsResult.topPriorities.length > 0 && (
            <div className="rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setShowPriorities(!showPriorities)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-medium">
                  Issues addressed from your original score
                </span>
                {showPriorities ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
              </button>
              {showPriorities && (
                <ol className="list-decimal space-y-1 border-t px-4 py-4 pl-9 text-sm text-muted-foreground">
                  {atsResult.topPriorities.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
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
            <ReviewHeaderEditor target="fixed" />
            <ResumeInlineEditor resume={fixedResume} target="fixed" />
          </div>
        ) : null}
        <ResumePreview resume={displayResume} />
      </div>
    </div>
  );
}
