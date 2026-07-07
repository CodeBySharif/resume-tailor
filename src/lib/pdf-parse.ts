"use client";

export interface PdfPreviewInfo {
  numPages: number;
}

async function initPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  return pdfjs;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await initPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n").trim();
}

export function renderPdfFirstPage(
  file: File,
  canvas: HTMLCanvasElement,
  maxWidth = 320
): { promise: Promise<PdfPreviewInfo>; cancel: () => void } {
  let renderTask: { promise: Promise<void>; cancel: () => void } | null = null;

  const promise = (async () => {
    const pdfjs = await initPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 1 });
    const scale = maxWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get canvas context");

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    renderTask = page.render({
      canvasContext: context,
      viewport: scaledViewport,
      canvas,
    });
    await renderTask.promise;

    return { numPages: pdf.numPages };
  })();

  return {
    promise,
    cancel: () => renderTask?.cancel(),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
