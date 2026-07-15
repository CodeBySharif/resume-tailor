const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTH_NAME_TO_NUM: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

function asDateString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

export function formatMonthYear(value: unknown): string {
  const text = asDateString(value);
  if (!text) return "";
  if (text.toLowerCase() === "present") return "Present";

  const match = text.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const month = parseInt(match[2], 10);
    if (month >= 1 && month <= 12) {
      return `${MONTHS[month - 1]} ${match[1]}`;
    }
  }

  return text;
}

export function formatDateRange(start: unknown, end: unknown): string {
  const startFmt = formatMonthYear(start);
  const endFmt = formatMonthYear(end);
  if (!startFmt && !endFmt) return "";
  if (!startFmt) return endFmt;
  if (!endFmt) return startFmt;
  return `${startFmt} – ${endFmt}`;
}

export function parseToMonthYear(value: unknown): string {
  const v = asDateString(value).trim();
  if (!v) return "";
  if (v.toLowerCase() === "present") return "Present";

  if (/^\d{4}-\d{2}$/.test(v)) return v;

  const iso = v.match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (iso) return `${iso[1]}-${iso[2]}`;

  const slash = v.match(/^(\d{1,2})\/(\d{4})$/);
  if (slash) {
    return `${slash[2]}-${slash[1].padStart(2, "0")}`;
  }

  const slashYFirst = v.match(/^(\d{4})\/(\d{1,2})$/);
  if (slashYFirst) {
    return `${slashYFirst[1]}-${slashYFirst[2].padStart(2, "0")}`;
  }

  const monthYear = v.match(/^([A-Za-z]+)[\s–-]+(\d{4})$/);
  if (monthYear) {
    const monthNum = MONTH_NAME_TO_NUM[monthYear[1].toLowerCase()];
    if (monthNum) return `${monthYear[2]}-${monthNum}`;
  }

  const yearOnly = v.match(/^(\d{4})$/);
  if (yearOnly) return `${yearOnly[1]}-01`;

  return v;
}

export function toMonthInputValue(value: unknown): string {
  const text = asDateString(value);
  if (!text || text.toLowerCase() === "present") return "";
  const parsed = parseToMonthYear(text);
  if (/^\d{4}-\d{2}$/.test(parsed)) return parsed;
  return "";
}

export function isPresentDate(value: unknown): boolean {
  return asDateString(value).toLowerCase() === "present";
}

export function monthYearToDate(value: string): Date | undefined {
  const parsed = toMonthInputValue(value);
  if (!parsed) return undefined;
  const [year, month] = parsed.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function dateToMonthYear(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

const CURRENT_YEAR = new Date().getFullYear();
export const YEAR_OPTIONS = Array.from({ length: 50 }, (_, i) => CURRENT_YEAR + 2 - i);
