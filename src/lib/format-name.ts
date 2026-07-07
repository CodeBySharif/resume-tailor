/**
 * Fixes text parsed from PDFs with spaces between each letter,
 * e.g. "S H A R I F M O H A M A D" → "SHARIF MOHAMAD"
 */
export function collapseSpacedLetters(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const parts = trimmed.split(/\s+/);
  if (parts.length === 0) return "";

  const words: string[] = [];
  let singleCharRun = "";

  const flushRun = () => {
    if (!singleCharRun) return;
    words.push(splitKnownCollapsedWords(singleCharRun));
    singleCharRun = "";
  };

  for (const part of parts) {
    if (part.length === 1) {
      singleCharRun += part;
    } else {
      flushRun();
      words.push(part);
    }
  }
  flushRun();

  return words.join(" ").replace(/\s+/g, " ").trim();
}

/** Split glued job-title tokens produced by letter-by-letter PDF text. */
function splitKnownCollapsedWords(run: string): string {
  const lower = run.toLowerCase();
  const pairs: Array<[string, string]> = [
    ["softwaredeveloper", "software developer"],
    ["softwareengineer", "software engineer"],
    ["fullstackdeveloper", "full stack developer"],
    ["webdeveloper", "web developer"],
    ["frontenddeveloper", "frontend developer"],
    ["backenddeveloper", "backend developer"],
    ["dataanalyst", "data analyst"],
    ["projectmanager", "project manager"],
    ["productmanager", "product manager"],
    ["systemsengineer", "systems engineer"],
    ["devopsengineer", "devops engineer"],
  ];

  for (const [glued, spaced] of pairs) {
    if (lower === glued) return spaced;
  }

  return run;
}

const TRAILING_JOB_TITLES = [
  "software developer",
  "software engineer",
  "full stack developer",
  "full-stack developer",
  "web developer",
  "frontend developer",
  "front-end developer",
  "backend developer",
  "back-end developer",
  "mobile developer",
  "data analyst",
  "data engineer",
  "devops engineer",
  "project manager",
  "product manager",
  "systems engineer",
  "ui/ux designer",
  "graphic designer",
  "quality assurance engineer",
  "qa engineer",
  "business analyst",
  "technical lead",
  "team lead",
  "senior software developer",
  "senior software engineer",
  "junior software developer",
  "junior software engineer",
];

/** Insert a space when a job-title word is glued to the end of a name token. */
export function unglueNameTitleBoundary(text: string): string {
  let result = text.trim();
  if (!result) return "";

  result = result.replace(
    /([A-Za-z])(Software Developer|Software Engineer|Full Stack Developer|Web Developer|Frontend Developer|Backend Developer)/gi,
    "$1 $2"
  );
  result = result.replace(/([A-Za-z])(SOFTWARE DEVELOPER|SOFTWARE ENGINEER)/gi, "$1 $2");
  result = result.replace(/([A-Za-z])(SOFTWARE)(?=\s|$)/gi, "$1 $2");
  result = result.replace(/([A-Za-z])(DEVELOPER)(?=\s|$)/gi, "$1 $2");

  return result.replace(/\s+/g, " ").trim();
}

/** Keep name and title in separate fields even when the parser merged them. */
export function normalizeHeaderNameTitle(
  rawName: string,
  rawTitle: string
): { name: string; title: string } {
  const name = unglueNameTitleBoundary(collapseSpacedLetters(rawName));
  const title = collapseSpacedLetters(rawTitle);

  if (title.trim()) {
    return { name: name.trim(), title: title.trim() };
  }

  const normalizedName = name.trim();
  const lower = normalizedName.toLowerCase();

  const sortedTitles = [...TRAILING_JOB_TITLES].sort(
    (a, b) => b.length - a.length
  );

  for (const jobTitle of sortedTitles) {
    if (lower.endsWith(jobTitle) && lower.length > jobTitle.length + 1) {
      const splitAt = normalizedName.length - jobTitle.length;
      return {
        name: normalizedName.slice(0, splitAt).trim(),
        title: normalizedName.slice(splitAt).trim(),
      };
    }
  }

  return { name: normalizedName, title: "" };
}

export function toTitleCase(text: string): string {
  return collapseSpacedLetters(text)
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDisplayName(name: string): string {
  const cleaned = collapseSpacedLetters(name || "Your Name");
  return cleaned.toUpperCase();
}

export function formatDisplayTitle(title: string): string {
  const cleaned = collapseSpacedLetters(title);
  if (!cleaned) return "";
  return cleaned.toUpperCase();
}

/** e.g. +60189424990 → +6018-9424990 */
export function formatDisplayPhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return trimmed;

  if (digits.startsWith("60") && digits.length >= 10) {
    const local = digits.slice(2);
    return `+60${local.slice(0, 2)}-${local.slice(2)}`;
  }

  if (digits.startsWith("01") && digits.length >= 10) {
    return `+60${digits.slice(1, 3)}-${digits.slice(3)}`;
  }

  return trimmed;
}

export function buildExportFileName(
  name: string,
  company: string,
  type: "resume" | "cover-letter"
): string {
  const cleanPart = (value: string, maxLen: number) =>
    collapseSpacedLetters(value)
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, maxLen);

  const namePart = cleanPart(name, 35) || "Resume";
  const companyPart = cleanPart(company, 35) || "Company";

  return `${namePart}_${companyPart}_${type}.pdf`;
}
