import { normalizePrintableText } from "./text-normalize";

function splitCompanySegments(company: string): string[] {
  return company
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Avoid "Company, Remote, Remote" when location is already in the company line. */
export function formatExperienceCompanyLine(
  company: string,
  location?: string
): string {
  const companyText = normalizePrintableText(company);
  const locationText = normalizePrintableText(location ?? "");
  if (!locationText) return companyText;
  if (!companyText) return locationText;

  const segments = splitCompanySegments(companyText);
  if (
    segments.some(
      (part) => part.toLowerCase() === locationText.toLowerCase()
    )
  ) {
    return companyText;
  }

  return `${companyText}, ${locationText}`;
}

/** Split trailing location out of company when both fields repeat the same place. */
export function dedupeExperienceLocation(
  company: string,
  location: string
): { company: string; location: string } {
  const companyText = normalizePrintableText(company);
  const locationText = normalizePrintableText(location);
  if (!locationText) return { company: companyText, location: "" };

  const segments = splitCompanySegments(companyText);
  const matchIndex = segments.findIndex(
    (part) => part.toLowerCase() === locationText.toLowerCase()
  );

  if (matchIndex >= 0) {
    const companyOnly = segments
      .filter((_, index) => index !== matchIndex)
      .join(", ");
    return {
      company: companyOnly || companyText,
      location: locationText,
    };
  }

  return { company: companyText, location: locationText };
}
