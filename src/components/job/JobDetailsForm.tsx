"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { useResumeStore } from "@/store/resume-store";

function computeJobCompletion(jobDetails: {
  company: string;
  role: string;
  jobDescription: string;
}): number {
  let score = 0;
  if (jobDetails.company.trim()) score += 20;
  if (jobDetails.role.trim()) score += 20;
  const jdLen = jobDetails.jobDescription.trim().length;
  score += Math.min(60, Math.round((jdLen / 500) * 60));
  return Math.min(100, score);
}

export function JobDetailsForm() {
  const { jobDetails, updateJobDetails, prevStep, nextStep } = useResumeStore();

  const completion = useMemo(() => computeJobCompletion(jobDetails), [jobDetails]);

  const canContinue =
    jobDetails.company.trim() &&
    jobDetails.role.trim() &&
    jobDetails.jobDescription.trim().length >= 50;

  const helperText =
    completion < 100
      ? `${completion}% complete — add more job description for better results`
      : "Ready to generate your tailored resume";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Job Details</h2>
          <p className="text-sm text-muted-foreground">
            Tell us about the role you&apos;re applying for
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={prevStep}>
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

      <div className="sticky top-0 z-10 space-y-2 rounded-lg border bg-card p-4 shadow-sm">
        <Progress value={completion}>
          <ProgressLabel>Form completion</ProgressLabel>
          <span className="ml-auto text-sm font-medium tabular-nums text-brand-accent">
            {completion}%
          </span>
        </Progress>
        <p className="text-xs text-muted-foreground">{helperText}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Target Position</CardTitle>
          <CardDescription>
            Paste the full job description for best tailoring results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-xs font-medium text-muted-foreground">
                Company *
              </Label>
              <Input
                id="company"
                placeholder="Acme Corp"
                value={jobDetails.company}
                onChange={(e) => updateJobDetails({ company: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs font-medium text-muted-foreground">
                Role / Title *
              </Label>
              <Input
                id="role"
                placeholder="Senior Software Engineer"
                value={jobDetails.role}
                onChange={(e) => updateJobDetails({ role: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="jd" className="text-xs font-medium text-muted-foreground">
              Job Description *
            </Label>
            <Textarea
              id="jd"
              rows={12}
              placeholder="Paste the full job description here…"
              value={jobDetails.jobDescription}
              onChange={(e) =>
                updateJobDetails({ jobDescription: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              {jobDetails.jobDescription.length} characters
              {jobDetails.jobDescription.length < 50 &&
                " (minimum 50 required)"}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="skills-exclude"
              className="text-xs font-medium text-muted-foreground"
            >
              Don&apos;t mention (optional)
            </Label>
            <Input
              id="skills-exclude"
              placeholder="e.g. DevOps, Kubernetes, AWS"
              value={jobDetails.skillsToExclude}
              onChange={(e) =>
                updateJobDetails({ skillsToExclude: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated skills the AI should not add to your resume or
              cover letter, even if the job asks for them.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="what-excites"
              className="text-xs font-medium text-muted-foreground"
            >
              What excites you about this role (optional)
            </Label>
            <Textarea
              id="what-excites"
              rows={3}
              placeholder="e.g. Their product mission, tech stack, team culture, growth opportunities…"
              value={jobDetails.whatExcitesYou}
              onChange={(e) =>
                updateJobDetails({ whatExcitesYou: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              If filled, the cover letter will highlight why you are eager to
              join this company.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="skill-gaps"
              className="text-xs font-medium text-muted-foreground"
            >
              Requirements you don&apos;t have (optional)
            </Label>
            <Textarea
              id="skill-gaps"
              rows={3}
              placeholder="e.g. They want 3 years DevOps experience — I have deployment exposure but not dedicated DevOps role"
              value={jobDetails.skillGaps}
              onChange={(e) =>
                updateJobDetails({ skillGaps: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              If filled, the cover letter will address these gaps honestly with
              transferable strengths.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
