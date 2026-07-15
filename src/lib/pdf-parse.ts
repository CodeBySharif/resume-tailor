"use client";

export interface PdfPreviewInfo {
  numPages: number;
}

function polyfillPromiseWithResolvers() {
  const P = Promise as typeof Promise & {
    withResolvers?: <T>() => {
      promise: Promise<T>;
      resolve: (value: T | PromiseLike<T>) => void;
      reject: (reason?: unknown) => void;
    };
  };

  if (typeof P.withResolvers === "function") return;

  P.withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

async function initPdfJs() {
  // Safari < 17.4 (and some mobile WebViews) lack Promise.withResolvers,
  // which modern pdf.js requires. Polyfill + legacy build fixes upload crashes.
  polyfillPromiseWithResolvers();

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  return pdfjs;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const pdfjs = await initPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const items = Array.isArray(content.items) ? content.items : [];
      const pageText = items
        .map((item) =>
          item && typeof item === "object" && "str" in item
            ? String((item as { str: string }).str)
            : ""
        )
        .join(" ");
      pages.push(pageText);
    }

    return pages.join("\n\n").trim();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/Promise\.withResolvers|undefined is not a function/i.test(msg)) {
      throw new Error(
        "This browser cannot read PDFs reliably. Update Safari/Chrome, or try “Use Template” / another browser."
      );
    }
    throw err instanceof Error
      ? err
      : new Error("Failed to read PDF. Try a text-based PDF.");
  }
}

export function renderPdfFirstPage(
  file: File,
  canvas: HTMLCanvasElement,
  maxWidth = 320
): { promise: Promise<PdfPreviewInfo>; cancel: () => void } {
  let renderTask: { promise: Promise<void>; cancel: () => void } | null = null;

  const promise = (async () => {
    try {
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
    } catch {
      // Preview is optional — don't block parsing if canvas render fails on mobile
      return { numPages: 0 };
    }
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
