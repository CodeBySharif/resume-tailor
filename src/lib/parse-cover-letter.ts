import type { ResumeHeader } from "@/lib/resume-schema";
import { createEmptyResume } from "@/lib/resume-schema";
import { normalizePrintableText } from "@/lib/text-normalize";

export interface ParsedCoverLetter {
  header: ResumeHeader;
  company: string;
  role: string;
  /** Body paragraphs only (no greeting / sign-off). */
  body: string;
}

const GREETING_RE = /^(dear|hi|hello)\b/i;
const GREETING_INLINE_RE = /\bDear\s+Hiring\s+Manager,?\s*/i;
const SIGN_OFF_RE =
  /^(sincerely|best regards|kind regards|warm regards|regards|yours truly|thank you|thanks)\b/i;
const SIGN_OFF_INLINE_RE =
  /\b(?:Sincerely|Best regards|Kind regards|Warm regards|Regards|Yours truly),?\s*/i;
const DATE_RE =
  /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}$/i;
const DATE_INLINE_RE =
  /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/i;
const RE_LINE_RE = /^re\s*:\s*(.+)$/i;
const RE_INLINE_RE = /\bRe:\s*(.+?)(?=\s+Dear\s+Hiring\s+Manager\b|$)/i;
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;
const HIRING_MANAGER_RE = /^hiring\s+manager\b/i;

function isContactLine(line: string): boolean {
  return (
    EMAIL_RE.test(line) ||
    (PHONE_RE.test(line) && /[|+]/.test(line)) ||
    (line.includes("|") && line.split("|").length >= 2)
  );
}

function parseContactLine(line: string, header: ResumeHeader): void {
  const parts = line.split("|").map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    if (EMAIL_RE.test(part) && !header.email) {
      header.email = part.match(EMAIL_RE)?.[0] ?? part;
      continue;
    }
    if (PHONE_RE.test(part) && !header.phone) {
      header.phone = part.match(PHONE_RE)?.[1]?.trim() ?? part;
      continue;
    }
    if (!header.city && !EMAIL_RE.test(part) && !PHONE_RE.test(part)) {
      header.city = part;
    }
  }
  if (!header.email) {
    const email = line.match(EMAIL_RE)?.[0];
    if (email) header.email = email;
  }
  if (!header.phone) {
    const phone = line.match(PHONE_RE)?.[1]?.trim();
    if (phone) header.phone = phone;
  }
}

function linesToBody(lines: string[]): string {
  const paragraphs: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current.length > 0) {
        paragraphs.push(current.join(" "));
        current = [];
      }
      continue;
    }
    current.push(trimmed);
  }
  if (current.length > 0) {
    paragraphs.push(current.join(" "));
  }

  return paragraphs.join("\n\n").trim();
}

function fillHeaderFromPreamble(
  preambleLines: string[],
  header: ResumeHeader
): void {
  const headerCandidates: string[] = [];
  for (const line of preambleLines) {
    if (DATE_RE.test(line)) break;
    if (HIRING_MANAGER_RE.test(line)) break;
    if (RE_LINE_RE.test(line)) break;
    headerCandidates.push(line);
  }

  for (const line of headerCandidates) {
    if (isContactLine(line)) {
      parseContactLine(line, header);
      continue;
    }
    if (!header.name) {
      header.name = line;
      continue;
    }
    if (!header.title) {
      header.title = line;
    }
  }
}

function parseFromLines(allLines: string[]): ParsedCoverLetter | null {
  const nonEmpty = allLines.map((l) => l.trim()).filter(Boolean);
  const greetingIdx = nonEmpty.findIndex((l) => GREETING_RE.test(l));
  if (greetingIdx < 0) return null;

  let signOffIdx = nonEmpty.findIndex((l) => SIGN_OFF_RE.test(l));
  if (signOffIdx < 0) signOffIdx = nonEmpty.length;

  const greetingLine = nonEmpty[greetingIdx];
  const signOffLine = signOffIdx < nonEmpty.length ? nonEmpty[signOffIdx] : null;

  const greetingLineIdx = allLines.findIndex((l) => l.trim() === greetingLine);
  const signOffLineIdx = signOffLine
    ? allLines.findIndex((l, i) => i > greetingLineIdx && l.trim() === signOffLine)
    : allLines.length;

  const preamble = nonEmpty.slice(0, greetingIdx);
  const bodySource = allLines
    .slice(greetingLineIdx + 1, signOffLineIdx >= 0 ? signOffLineIdx : allLines.length)
    .map((l) => l.trimEnd());

  const header: ResumeHeader = { ...createEmptyResume().header };
  let company = "";
  let role = "";

  fillHeaderFromPreamble(preamble, header);

  for (let i = 0; i < preamble.length; i++) {
    const line = preamble[i];
    const reMatch = line.match(RE_LINE_RE);
    if (reMatch) {
      role = reMatch[1].trim();
      continue;
    }
    if (HIRING_MANAGER_RE.test(line)) {
      const next = preamble[i + 1];
      if (
        next &&
        !DATE_RE.test(next) &&
        !RE_LINE_RE.test(next) &&
        !GREETING_RE.test(next)
      ) {
        company = next;
      }
    }
  }

  const body = linesToBody(bodySource);
  if (!body && !header.name && !company && !role) return null;

  return { header, company, role, body };
}

/**
 * Fallback when PDF text was flattened to one/few lines (common with extractText).
 * Matches the templated letter this app generates.
 */
function parseFromFlatText(raw: string): ParsedCoverLetter | null {
  const text = normalizePrintableText(raw).replace(/\s+/g, " ").trim();
  if (!text) return null;

  const greeting = GREETING_INLINE_RE.exec(text);
  if (!greeting || greeting.index === undefined) return null;

  const afterGreeting = greeting.index + greeting[0].length;
  const afterGreetingText = text.slice(afterGreeting);
  const signOff = SIGN_OFF_INLINE_RE.exec(afterGreetingText);
  const bodyEnd = signOff?.index ?? afterGreetingText.length;
  const body = afterGreetingText.slice(0, bodyEnd).trim();

  const preamble = text.slice(0, greeting.index).trim();
  const header: ResumeHeader = { ...createEmptyResume().header };

  const reMatch = preamble.match(RE_INLINE_RE);
  const role = reMatch?.[1]?.trim() ?? "";

  const hmMatch = preamble.match(
    /\bHiring\s+Manager\s+(.+?)\s+Re:/i
  );
  const company = hmMatch?.[1]?.trim() ?? "";

  const dateMatch = DATE_INLINE_RE.exec(preamble);
  const beforeDate = dateMatch
    ? preamble.slice(0, dateMatch.index).trim()
    : preamble.replace(/\bHiring\s+Manager\b[\s\S]*$/i, "").trim();

  // beforeDate ≈ "NAME TITLE phone | email | city"
  const contactMatch = beforeDate.match(
    /(.+?)\s+(\+?\d[\d\s().-]{7,}\d)\s*\|\s*([^\s|]+@[^\s|]+)\s*\|\s*(.+)$/i
  );
  if (contactMatch) {
    const nameTitle = contactMatch[1].trim();
    header.phone = contactMatch[2].trim();
    header.email = contactMatch[3].trim();
    header.city = contactMatch[4].trim();
    // Last ALL-CAPS / Title Case chunk as title if multiple tokens
    const parts = nameTitle.split(/\s{2,}|\s(?=[A-Z][A-Z])/);
    // Simpler: first words before a job-title-looking trailing phrase
    const titleGuess = nameTitle.match(
      /\b((?:Software|Senior|Junior|Lead|Full[\s-]?Stack|Backend|Frontend|Web|Mobile|Data|DevOps|Cloud|Product|UI\/UX)?\s*(?:Developer|Engineer|Designer|Manager|Analyst|Architect|Consultant|Specialist|Programmer)(?:\s+[IVX]+)?)\s*$/i
    );
    if (titleGuess && titleGuess.index !== undefined && titleGuess.index > 0) {
      header.name = nameTitle.slice(0, titleGuess.index).trim();
      header.title = titleGuess[1].trim();
    } else {
      // Assume first 2–4 capitalized words are name
      const tokens = nameTitle.split(/\s+/);
      if (tokens.length <= 4) {
        header.name = nameTitle;
      } else {
        header.name = tokens.slice(0, 3).join(" ");
        header.title = tokens.slice(3).join(" ");
      }
    }
  } else {
    // Contact line with pipes somewhere
    const pipeIdx = beforeDate.indexOf("|");
    if (pipeIdx >= 0) {
      const maybeContact = beforeDate.slice(
        beforeDate.search(PHONE_RE) >= 0
          ? beforeDate.search(PHONE_RE)
          : pipeIdx - 20
      );
      parseContactLine(maybeContact, header);
      const namePart = beforeDate
        .slice(0, beforeDate.search(PHONE_RE) >= 0 ? beforeDate.search(PHONE_RE) : pipeIdx)
        .trim();
      if (namePart) {
        const tokens = namePart.split(/\s+/);
        if (tokens.length <= 4) header.name = namePart;
        else {
          header.name = tokens.slice(0, 3).join(" ");
          header.title = tokens.slice(3).join(" ");
        }
      }
    } else if (beforeDate) {
      const tokens = beforeDate.split(/\s+/);
      header.name = tokens.slice(0, Math.min(3, tokens.length)).join(" ");
      if (tokens.length > 3) header.title = tokens.slice(3).join(" ");
    }
  }

  if (!body && !header.name && !company && !role) return null;

  // Flattened body: split on sentence boundaries into ~paragraph chunks when possible
  const bodyParagraphs = body
    .split(/(?<=\.)\s+(?=[A-Z])/)
    .reduce<string[]>((acc, sentence) => {
      const last = acc[acc.length - 1];
      if (!last || last.length > 280) {
        acc.push(sentence);
      } else {
        acc[acc.length - 1] = `${last} ${sentence}`;
      }
      return acc;
    }, [])
    .join("\n\n");

  return {
    header,
    company,
    role,
    body: bodyParagraphs || body,
  };
}

/**
 * Split raw PDF/extracted cover letter text into templated fields
 * so we can edit in the formatted canvas instead of a plain dump.
 */
export function parseCoverLetterUpload(raw: string): ParsedCoverLetter {
  const empty = createEmptyResume().header;
  const normalized = normalizePrintableText(raw);
  if (!normalized.trim()) {
    return { header: empty, company: "", role: "", body: "" };
  }

  const lines = normalized
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trimEnd());
  const nonEmptyCount = lines.filter((l) => l.trim()).length;

  const fromLines = nonEmptyCount >= 4 ? parseFromLines(lines) : null;
  if (
    fromLines &&
    fromLines.body &&
    (fromLines.header.name || fromLines.company || fromLines.role) &&
    !/Hiring\s+Manager|^\s*Re:|Dear\s+Hiring/im.test(fromLines.body)
  ) {
    return fromLines;
  }

  const flat = parseFromFlatText(normalized);
  if (flat) return flat;

  if (fromLines?.body) return fromLines;

  return {
    header: empty,
    company: "",
    role: "",
    body: normalized.trim(),
  };
}

/** Prefer master/session header when upload parse left name empty. */
export function mergeCoverLetterHeader(
  parsed: ResumeHeader,
  fallback: ResumeHeader | null | undefined
): ResumeHeader {
  if (!fallback) return parsed;
  return {
    name: parsed.name.trim() || fallback.name,
    title: parsed.title.trim() || fallback.title,
    phone: parsed.phone.trim() || fallback.phone,
    email: parsed.email.trim() || fallback.email,
    city: parsed.city.trim() || fallback.city,
    linkedin: (parsed.linkedin ?? "").trim() || fallback.linkedin,
    portfolio: (parsed.portfolio ?? "").trim() || fallback.portfolio,
    showLinkedin: parsed.showLinkedin || fallback.showLinkedin,
    showPortfolio: parsed.showPortfolio || fallback.showPortfolio,
  };
}
