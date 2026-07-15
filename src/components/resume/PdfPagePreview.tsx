"use client";

import { useEffect, useRef } from "react";
import { FileText } from "lucide-react";
import { formatFileSize, renderPdfFirstPage } from "@/lib/pdf-parse";
import { cn } from "@/lib/utils";

interface PdfPagePreviewProps {
  file: File | null;
  className?: string;
  /** Constrain preview so cards don't expand to full page height. */
  size?: "sm" | "md" | "full";
}

const SIZE_CLASS = {
  sm: "max-w-[160px]",
  md: "max-w-[220px]",
  full: "max-w-full",
} as const;

export function PdfPagePreview({
  file,
  className,
  size = "full",
}: PdfPagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!file || !canvasRef.current) return;

    let cancelled = false;
    const { promise, cancel } = renderPdfFirstPage(file, canvasRef.current);
    promise
      .then((info) => {
        if (!cancelled) pageCountRef.current = info.numPages;
      })
      .catch(() => {
        /* cancelled or failed */
      });

    return () => {
      cancelled = true;
      cancel();
    };
  }, [file]);

  if (!file) {
    return (
      <div
        className={cn(
          "mx-auto flex aspect-[8.5/11] w-full items-center justify-center rounded-lg border border-dashed bg-muted/30",
          SIZE_CLASS[size],
          className
        )}
      >
        <FileText className="size-8 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className={cn("mx-auto w-full space-y-1.5", SIZE_CLASS[size], className)}>
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <canvas ref={canvasRef} className="mx-auto block w-full" />
      </div>
      <div className="text-center text-xs text-muted-foreground">
        <p className="truncate font-medium text-foreground">{file.name}</p>
        <p>{formatFileSize(file.size)}</p>
      </div>
    </div>
  );
}
