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

export function compareOpenings<T extends Dated>(a: T, b: T, today = startOfToday()) {
  const rank = (job: Dated) => {
    const end = time(job.deadlineAt);
    const posted = time(job.postedAt);
    const seen = time(job.firstSeenAt);
    const postedRank = Number.isNaN(posted) ? seen : posted;
    if (!Number.isNaN(end) && end >= today) return [0, end, -postedRank] as const;
    if (Number.isNaN(end)) return [1, 0, -postedRank] as const;
    return [2, -end, -postedRank] as const;
  };
  const left = rank(a);
  const right = rank(b);
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}
