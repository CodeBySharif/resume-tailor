/**
 * Safely parse a fetch Response as JSON.
 * Avoids cryptic "Unexpected token '<'" when the server returns HTML
 * (timeouts, 404 pages, Next.js error overlays).
 */
export async function readJsonResponse<T = unknown>(
  response: Response
): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      `Empty response from server (HTTP ${response.status}). Please try again.`
    );
  }

  const looksLikeHtml =
    text.trimStart().startsWith("<!DOCTYPE") ||
    text.trimStart().startsWith("<html") ||
    contentType.includes("text/html");

  if (looksLikeHtml) {
    if (response.status === 413) {
      throw new Error(
        "Request is too large. Try a shorter job description or a shorter resume."
      );
    }
    if (response.status === 504 || response.status === 502) {
      throw new Error(
        "The server timed out while generating. Try again, or switch provider in Settings."
      );
    }
    if (response.status >= 500) {
      throw new Error(
        `Server error (HTTP ${response.status}). Check your API key in Settings and try again.`
      );
    }
    throw new Error(
      `Server returned an unexpected page instead of data (HTTP ${response.status}). Try refreshing and running again.`
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Could not parse server response (HTTP ${response.status}). Please try again.`
    );
  }
}
