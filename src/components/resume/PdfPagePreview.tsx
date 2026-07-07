"use client";

import { useEffect, useRef } from "react";
import { FileText } from "lucide-react";
import { formatFileSize, renderPdfFirstPage } from "@/lib/pdf-parse";
import { cn } from "@/lib/utils";

interface PdfPagePreviewProps {
  file: File | null;
  className?: string;
}

export function PdfPagePreview({ file, className }: PdfPagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!file || !canvasRef.current) return;

    let cancelled = false;
    const { promise, cancel } = renderPdfFirstPage(file, canvasRef.current);
    promise.then((info) => {
      if (!cancelled) pageCountRef.current = info.numPages;
    }).catch(() => {
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
          "flex aspect-[8.5/11] items-center justify-center rounded-lg border border-dashed bg-muted/30",
          className
        )}
      >
        <FileText className="size-10 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <canvas ref={canvasRef} className="mx-auto block w-full" />
      </div>
      <div className="text-center text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{file.name}</p>
        <p>{formatFileSize(file.size)}</p>
      </div>
    </div>
  );
}
