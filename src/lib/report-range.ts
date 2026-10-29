const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MAX_SPAN_DAYS = 365;

export type ReportStatus = "all" | "open" | "closed";
export type ReportPlace = "all" | "kigali" | "rwanda" | "remote";

export type ReportQuery = {
  from: string;
  to: string;
  status: ReportStatus;
  place: ReportPlace;
};

function kigaliToday(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kigali",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** A real calendar day as YYYY-MM-DD, or null when the text is not one. */
export function parseReportDate(value: string): string | null {
  const match = DATE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function spanDays(from: string, to: string) {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  const start = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const end = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.round((end - start) / 86_400_000);
}

export function validateReport(input: {
  from?: string;
  to?: string;
  status?: string;
  place?: string;
}): { ok: true; query: ReportQuery } | { ok: false; error: string } {
  const fromText = input.from?.trim() ?? "";
  const toText = input.to?.trim() ?? "";
  if (!fromText) return { ok: false, error: "Enter the first date the report should cover." };
  if (!toText) return { ok: false, error: "Enter the last date the report should cover." };
  const from = parseReportDate(fromText);
  const to = parseReportDate(toText);
  if (!from || !to) return { ok: false, error: "Enter real dates. A day like 31 February is not accepted." };
  if (from > to) return { ok: false, error: "The first date must be on or before the last date." };
  if (to > kigaliToday()) return { ok: false, error: "The last date cannot be after today." };
  if (spanDays(from, to) > MAX_SPAN_DAYS) return { ok: false, error: "Cover 366 days or fewer." };

  const status = input.status || "all";
  const place = input.place || "all";
  if (status !== "all" && status !== "open" && status !== "closed") {
    return { ok: false, error: "Choose all openings, open, or closed." };
  }
  if (place !== "all" && place !== "kigali" && place !== "rwanda" && place !== "remote") {
    return { ok: false, error: "Choose a place." };
  }
  return { ok: true, query: { from, to, status, place } };
}

export function reportGeneratedAt(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Kigali",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("day")}/${part("month")}/${part("year")}, ${part("hour")}:${part("minute")}`;
}
