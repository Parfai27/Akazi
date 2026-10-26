export type Shelf = "kigali" | "country" | "remote";
export type JobFunction = "education" | "engineering" | "finance" | "people" | "field" | "other";

export const SHELVES: { id: Shelf; label: string; hint: string }[] = [
  { id: "kigali", label: "In Kigali", hint: "On-site and hybrid" },
  { id: "country", label: "Elsewhere in Rwanda", hint: "On-site and hybrid" },
  { id: "remote", label: "Remote", hint: "Anywhere" },
];

export const JOB_FUNCTIONS: { id: JobFunction; label: string }[] = [
  { id: "education", label: "Education" },
  { id: "engineering", label: "Engineering" },
  { id: "finance", label: "Finance" },
  { id: "people", label: "People" },
  { id: "field", label: "Field" },
  { id: "other", label: "Other" },
];

const FUNCTION_RULES: { id: JobFunction; pattern: RegExp }[] = [
  { id: "finance", pattern: /\b(accountants?|accounts\b|financ\w*|audits?|procurement|bookkeep\w*)\b/i },
  {
    id: "education",
    pattern:
      /\b(adjuncts?|curricul\w*|students?|enroll\w*|admissions?|provosts?|learning|teaching|academ\w*|professors?)\b/i,
  },
  {
    id: "engineering",
    pattern: /\b(engineers?|software|developers?|data scien\w*|networks?|technicians?|full stack|it operations)\b/i,
  },
  {
    id: "field",
    pattern: /\b(seeds?|outgrow\w*|agronom\w*|construction|health|humanitarian|nurs\w*|agricultur\w*)\b/i,
  },
  {
    id: "people",
    pattern:
      /\b(market\w*|partnerships?|people|human resources?|recruit\w*|sales|engagement|brand\w*|communications?|media|relations|account directors?)\b/i,
  },
];

export function shelfOf(job: { place: string; workMode: string }): Shelf {
  if (job.workMode === "remote") return "remote";
  if (job.place === "kigali") return "kigali";
  return "country";
}

export function jobFunction(title: string): JobFunction {
  const match = FUNCTION_RULES.find((rule) => rule.pattern.test(title));
  return match?.id ?? "other";
}

export function functionLabel(id: string) {
  return JOB_FUNCTIONS.find((item) => item.id === id)?.label ?? "Other";
}

export function shelfLabel(id: string) {
  return SHELVES.find((item) => item.id === id)?.label ?? id;
}

type Dated = { deadlineAt: string | null; postedAt: string | null; firstSeenAt: string };

function time(iso: string | null) {
  if (!iso) return Number.NaN;
  const value = new Date(iso).getTime();
  return Number.isNaN(value) ? Number.NaN : value;
}

export function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

export function deadlineKind(iso: string | null, today = startOfToday()): "soon" | "later" | "passed" | "none" {
  const end = time(iso);
  if (Number.isNaN(end)) return "none";
  if (end < today) return "passed";
  return end - today <= 21 * 86_400_000 ? "soon" : "later";
}

export function deadlineOpen(iso: string | null, today = startOfToday()): boolean {
  return deadlineKind(iso, today) !== "passed";
}

/** A role posted within this window is New. */
export const NEW_WINDOW_MS = 7 * 86_400_000;

export function postedRecently(job: { postedAt: string | null }, now = Date.now()) {
  const posted = time(job.postedAt);
  if (Number.isNaN(posted)) return false;
  const age = now - posted;
  return age >= -86_400_000 && age <= NEW_WINDOW_MS;
}

/** Newest posting first. A role with no post date follows dated ones. */
export function compareOpenings<T extends Dated>(a: T, b: T) {
  const rank = (job: Dated) => {
    const posted = time(job.postedAt);
    return Number.isNaN(posted) ? Number.NEGATIVE_INFINITY : posted;
  };
  const posted = rank(b) - rank(a);
  if (posted !== 0) return posted;
  const endA = time(a.deadlineAt);
  const endB = time(b.deadlineAt);
  const left = Number.isNaN(endA) ? Number.POSITIVE_INFINITY : endA;
  const right = Number.isNaN(endB) ? Number.POSITIVE_INFINITY : endB;
  return left - right;
}
