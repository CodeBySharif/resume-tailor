import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdfBuffer } from "@/lib/pdf-extract-server";

export const maxDuration = 60;
export const runtime = "nodejs";

/** Extract plain text from an uploaded PDF (no AI). Used for cover letter / CV edit flow. */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "PDF file upload is required" },
        { status: 400 }
      );
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    const fileName =
      file instanceof File && file.name ? file.name : "document.pdf";
    if (
      file.type &&
      !file.type.includes("pdf") &&
      !fileName.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { error: "Please upload a PDF file" },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const text = await extractTextFromPdfBuffer(bytes);

    return NextResponse.json({ text });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to extract PDF text";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
