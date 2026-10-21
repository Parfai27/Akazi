export function safeHttpUrl(value: string | undefined | null, base?: string): string | null {
  if (!value) return null;
  try {
    const url = base ? new URL(value, base) : new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parseDate(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

const MONTH =
  "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";

export function extractDeadline(text: string): string | null {
  const pattern = new RegExp(
    String.raw`(?:application\s+deadline|closing\s+date|apply\s+by|deadline)\s*[:\-]?\s*((?:\d{1,2}(?:st|nd|rd|th)?\s+(?:${MONTH})\s+\d{4})|(?:(?:${MONTH})\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4})|(?:\d{4}-\d{2}-\d{2}))`,
    "i",
  );
  const match = text.match(pattern);
  if (!match) return null;
  return parseDate(match[1].replace(/(\d)(?:st|nd|rd|th)\b/i, "$1").replace(/\.$/, ""));
}

export function formatPosted(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function deadlineLabel(iso: string | null): string {
  const formatted = formatPosted(iso);
  if (!iso || !formatted) return "Deadline not listed";
  const end = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (end.getTime() < today.getTime()) return `Deadline passed · ${formatted}`;
  return `Deadline ${formatted}`;
}

export function deadlineShort(iso: string | null): string | null {
  const formatted = formatPosted(iso);
  if (!iso || !formatted) return null;
  const end = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (end.getTime() < today.getTime()) return `Passed ${formatted}`;
  return `Closes ${formatted}`;
}
