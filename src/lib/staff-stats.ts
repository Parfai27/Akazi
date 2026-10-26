import { io } from "next/cache";
import { sqlite } from "@/db";
import { JOB_FUNCTIONS, jobFunction, type JobFunction } from "@/lib/organize";
import { countRoleViewers, rememberJobViewer, restoreStudyRecords } from "@/lib/record-log";
import { loadRememberedVisits, mergeVisits, rememberVisit } from "@/lib/visit-log";

const ZONE = "Africa/Kigali";

export type VisitTotals = { people: number; visits: number };

export type StaffStats = {
  all: VisitTotals;
  today: VisitTotals;
  week: VisitTotals;
  month: VisitTotals;
  weeks: { label: string; people: number; visits: number }[];
  months: { label: string; people: number; visits: number }[];
  functions: { id: JobFunction; label: string; visits: number; share: number }[];
  signupsThisMonth: number;
  signupsTotal: number;
  signupMonths: { label: string; count: number }[];
};

type VisitRow = { day: string; visitor: string; path: string; jobFunction: string | null };

function kigaliDay(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(ymd: string, days: number) {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mondayOf(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return addDays(ymd, weekday === 0 ? -6 : 1 - weekday);
}

function shiftMonth(ym: string, delta: number) {
  const [year, month] = ym.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

function shortDay(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function shortMonth(ym: string) {
  const [year, month] = ym.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

function tally(rows: VisitRow[], from: string, to: string): VisitTotals {
  const people = new Set<string>();
  let visits = 0;
  for (const row of rows) {
    if (row.day < from || row.day > to) continue;
    visits += 1;
    people.add(row.visitor);
  }
  return { people: people.size, visits };
}

export async function recordVisit(visitor: string, path: string): Promise<number | null> {
  const day = kigaliDay();
  let role: JobFunction | null = null;
  const match = /^\/jobs\/([0-9a-f]{16})$/.exec(path);
  let viewed: { sourceId: string; externalId: string } | null = null;
  if (match) {
    const job = sqlite()
      .prepare("SELECT title, source_id AS sourceId, external_id AS externalId FROM jobs WHERE public_id = ?")
      .get(match[1]) as { title: string; sourceId: string; externalId: string } | undefined;
    if (job) {
      role = jobFunction(job.title);
      viewed = { sourceId: job.sourceId, externalId: job.externalId };
    }
  }
  sqlite()
    .prepare(
      `INSERT INTO visits (day, visitor, path, job_function, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(day, visitor, path) DO NOTHING`,
    )
    .run(day, visitor, path, role, new Date().toISOString());
  await rememberVisit({ day, visitor, path, jobFunction: role });
  if (!match) return null;
  if (viewed) await rememberJobViewer(viewed.sourceId, viewed.externalId, visitor);
  return countRoleViewers(match[1], viewed);
}

export async function getStaffStats(): Promise<StaffStats> {
  await io();
  await restoreStudyRecords();
  const today = kigaliDay();
  const weekStart = mondayOf(today);
  const monthStart = `${today.slice(0, 7)}-01`;
  const weekChartStart = mondayOf(addDays(today, -7 * 7));
  const monthKeys = Array.from({ length: 6 }, (_, index) => shiftMonth(today.slice(0, 7), index - 5));
  const queryStart = `${monthKeys[0]}-01` < weekChartStart ? `${monthKeys[0]}-01` : weekChartStart;

  const local = sqlite()
    .prepare("SELECT day, visitor, path, job_function AS jobFunction FROM visits")
    .all() as VisitRow[];
  const stored = mergeVisits(local, await loadRememberedVisits());
  const rows = stored.filter((row) => row.day >= queryStart);

  const weeks = Array.from({ length: 8 }, (_, index) => {
    const start = addDays(weekChartStart, index * 7);
    const end = addDays(start, 6);
    const totals = tally(rows, start, end > today ? today : end);
    return { label: shortDay(start), ...totals };
  });

  const months = monthKeys.map((key) => {
    const end = key === today.slice(0, 7) ? today : `${key}-31`;
    return { label: shortMonth(key), ...tally(rows, `${key}-01`, end) };
  });

  const functionCounts = Object.fromEntries(JOB_FUNCTIONS.map((item) => [item.id, 0])) as Record<JobFunction, number>;
  for (const row of rows) {
    if (row.day < monthStart || row.day > today || !row.jobFunction) continue;
    if (row.jobFunction in functionCounts) functionCounts[row.jobFunction as JobFunction] += 1;
  }
  const functionTotal = Object.values(functionCounts).reduce((sum, count) => sum + count, 0);
  const functions = JOB_FUNCTIONS.map((item) => ({
    id: item.id,
    label: item.label,
    visits: functionCounts[item.id],
    share: functionTotal === 0 ? 0 : Math.round((functionCounts[item.id] / functionTotal) * 100),
  })).sort((a, b) => b.visits - a.visits || a.label.localeCompare(b.label));

  const people = new Set(stored.map((row) => row.visitor));
  const all: VisitTotals = { people: people.size, visits: stored.length };
  const created = sqlite().prepare("SELECT created_at AS createdAt FROM subscribers").all() as { createdAt: string }[];
  const signupCounts = new Map(monthKeys.map((key) => [key, 0]));
  for (const row of created) {
    const date = new Date(row.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = kigaliDay(date).slice(0, 7);
    if (signupCounts.has(key)) signupCounts.set(key, (signupCounts.get(key) ?? 0) + 1);
  }

  return {
    all: { people: Number(all.people ?? 0), visits: Number(all.visits ?? 0) },
    today: tally(rows, today, today),
    week: tally(rows, weekStart, today),
    month: tally(rows, monthStart, today),
    weeks,
    months,
    functions,
    signupsThisMonth: signupCounts.get(today.slice(0, 7)) ?? 0,
    signupsTotal: created.length,
    signupMonths: monthKeys.map((key) => ({ label: shortMonth(key), count: signupCounts.get(key) ?? 0 })),
  };
}
