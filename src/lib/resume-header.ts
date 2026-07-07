import type { ResumeHeader } from "@/lib/resume-schema";
import { formatDisplayName, formatDisplayPhone } from "@/lib/format-name";

export function getHeaderContactParts(header: ResumeHeader): string[] {
  const parts = [
    header.phone ? formatDisplayPhone(header.phone) : "",
    header.email,
    header.city,
  ].filter(Boolean);

  if (header.showLinkedin && header.linkedin) {
    parts.push(header.linkedin);
  }
  if (header.showPortfolio && header.portfolio) {
    parts.push(header.portfolio);
  }

  return parts as string[];
}

export function getHeaderContactLine(header: ResumeHeader): string {
  return getHeaderContactParts(header).join(" | ");
}

export function getCoverLetterSenderLines(header: ResumeHeader): string[] {
  const name = formatDisplayName(header.name);
  return [name, header.phone, header.email, header.city].filter(
    Boolean
  ) as string[];
}

export function stripCoverLetterSignature(text: string): string {
  return text
    .replace(/\n*(?:Sincerely|Best regards|Kind regards|Regards),?\s*\n*[\s\S]*$/i, "")
    .replace(/^Dear\s+.+?,?\s*\n+/i, "")
    .trim();
}

export function getCoverLetterGreeting(): string {
  return "Dear Hiring Manager,";
}
