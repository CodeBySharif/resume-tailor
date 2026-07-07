"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Resume, ResumeHeader } from "@/lib/resume-schema";
import { useResumeStore } from "@/store/resume-store";

function HeaderField({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function ReviewHeaderEditor() {
  const { tailoredResume, originalResume, setTailoredResume } = useResumeStore();
  const base = tailoredResume ?? originalResume;

  if (!base) return null;

  const updateHeader = (patch: Partial<ResumeHeader>) => {
    const next: Resume = {
      ...base,
      header: { ...base.header, ...patch },
    };
    setTailoredResume(next);
  };

  const header = (tailoredResume ?? base).header;

  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <p className="mb-3 text-sm font-bold text-foreground">Contact & Header</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <HeaderField
          id="review-name"
          label="Full Name"
          value={header.name}
          onChange={(name) => updateHeader({ name })}
        />
        <HeaderField
          id="review-title"
          label="Professional Title"
          value={header.title}
          onChange={(title) => updateHeader({ title })}
        />
        <HeaderField
          id="review-email"
          label="Email"
          type="email"
          value={header.email}
          onChange={(email) => updateHeader({ email })}
        />
        <HeaderField
          id="review-phone"
          label="Phone"
          value={header.phone}
          onChange={(phone) => updateHeader({ phone })}
        />
        <HeaderField
          id="review-city"
          label="City / Location"
          value={header.city}
          onChange={(city) => updateHeader({ city })}
        />
      </div>
    </div>
  );
}
