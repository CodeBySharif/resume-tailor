import type { ResumeHeader } from "@/lib/resume-schema";
import { formatDisplayName, formatDisplayTitle } from "@/lib/format-name";
import { getHeaderContactLine } from "@/lib/resume-header";
import { cn } from "@/lib/utils";

interface ResumeHeaderBlockProps {
  header: ResumeHeader;
  className?: string;
}

const HEADER_ROW_GAP = "mb-1.5";

export function ResumeHeaderBlock({ header, className }: ResumeHeaderBlockProps) {
  const contactLine = getHeaderContactLine(header);
  const name = formatDisplayName(header.name);
  const title = formatDisplayTitle(header.title);

  return (
    <div className={cn("pb-4 text-center", className)}>
      <h2
        className={cn(
          "text-[1.35rem] font-bold leading-none tracking-normal text-gray-900",
          (title || contactLine) && HEADER_ROW_GAP
        )}
      >
        {name}
      </h2>
      {title && (
        <p
          className={cn(
            "text-xs font-semibold leading-none tracking-wide text-gray-500",
            contactLine && HEADER_ROW_GAP
          )}
        >
          {title}
        </p>
      )}
      {contactLine && (
        <p className="text-[11px] leading-none text-gray-600">{contactLine}</p>
      )}
    </div>
  );
}
