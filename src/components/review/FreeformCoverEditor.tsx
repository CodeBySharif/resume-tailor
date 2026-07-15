"use client";

import { cn } from "@/lib/utils";

/** Editable page that mirrors the uploaded letter — no template header/greeting wrap. */
export function FreeformCoverEditor({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-8 text-[13px] leading-[1.7] text-gray-900 shadow-sm sm:p-10",
        className
      )}
    >
      <textarea
        aria-label="Cover letter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={22}
        placeholder="Your cover letter text appears here — edit it as it should appear in the PDF."
        className="w-full min-h-[480px] resize-y border-0 bg-transparent p-0 text-[13px] leading-[1.7] text-gray-900 outline-none placeholder:text-gray-400"
      />
    </div>
  );
}

/** Read-only freeform letter page. */
export function FreeformCoverPreview({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const paragraphs = value.split(/\n\n+/).filter(Boolean);
  const lines =
    paragraphs.length > 0
      ? paragraphs
      : value
          .split(/\n/)
          .map((l) => l.trim())
          .filter(Boolean);

  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-8 text-[13px] leading-[1.7] text-gray-900 shadow-sm sm:p-10",
        className
      )}
    >
      {lines.length > 0 ? (
        <div className="space-y-3 whitespace-pre-wrap">
          {paragraphs.length > 0
            ? paragraphs.map((para, i) => <p key={i}>{para}</p>)
            : lines.map((line, i) => <p key={i}>{line}</p>)}
        </div>
      ) : (
        <p className="italic text-gray-400">No cover letter text yet.</p>
      )}
    </div>
  );
}
