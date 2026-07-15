import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

/**
 * Server-side PDF text extraction (Node). Avoids Safari/mobile pdf.js worker issues
 * by never running PDF parsing in the browser for the upload → parse path.
 */
export async function extractTextFromPdfBuffer(
  input: ArrayBuffer | Uint8Array | Buffer
): Promise<string> {
  const data =
    input instanceof Uint8Array
      ? input
      : input instanceof Buffer
        ? new Uint8Array(input)
        : new Uint8Array(input);

  if (data.byteLength === 0) {
    throw new Error("PDF file is empty");
  }

  // Cap ~12MB to protect serverless memory
  if (data.byteLength > 12 * 1024 * 1024) {
    throw new Error("PDF is too large (max 12MB). Try a smaller file.");
  }

  const require = createRequire(import.meta.url);
  const workerPath = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
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

  const text = pages.join("\n\n").trim();
  if (!text) {
    throw new Error(
      "Could not extract text from PDF. Try a text-based PDF (not a scanned image)."
    );
  }

  return text;
}
