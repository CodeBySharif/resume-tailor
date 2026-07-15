import { extractText, getDocumentProxy } from "unpdf";

/** Always return a plain Uint8Array — pdf.js rejects Node Buffer even though Buffer extends Uint8Array. */
function toPlainUint8Array(input: ArrayBuffer | Uint8Array | Buffer): Uint8Array {
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }
  // Copy so the result is not a Buffer subclass
  return new Uint8Array(input);
}

/**
 * Server-side PDF text extraction for Node / Vercel.
 * Uses unpdf (serverless PDF.js build) — avoids browser globals like DOMMatrix
 * that plain pdfjs-dist expects in Node.
 */
export async function extractTextFromPdfBuffer(
  input: ArrayBuffer | Uint8Array | Buffer
): Promise<string> {
  const data = toPlainUint8Array(input);

  if (data.byteLength === 0) {
    throw new Error("PDF file is empty");
  }

  // Cap ~12MB to protect serverless memory
  if (data.byteLength > 12 * 1024 * 1024) {
    throw new Error("PDF is too large (max 12MB). Try a smaller file.");
  }

  const pdf = await getDocumentProxy(data);
  const { text, totalPages } = await extractText(pdf, { mergePages: true });
  const merged = (typeof text === "string" ? text : "").trim();

  if (!merged) {
    throw new Error(
      "Could not extract text from PDF. Try a text-based PDF (not a scanned image)."
    );
  }

  if (totalPages === 0) {
    throw new Error("PDF has no pages");
  }

  return merged;
}
