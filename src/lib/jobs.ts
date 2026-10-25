import { desc, eq, sql } from "drizzle-orm";
import { io } from "next/cache";
import { db } from "@/db";
import { crawlRuns, jobs, type JobRecord } from "@/db/schema";
import {
  JOB_FUNCTIONS,
  SHELVES,
  compareOpenings,
  deadlineKind,
  deadlineOpen,
  jobFunction,
  shelfOf,
  type JobFunction,
  type Shelf,
} from "@/lib/organize";
import { restoreStudyRecords } from "@/lib/record-log";

export type JobFilters = {
  q?: string;
  shelf?: string;
  fn?: string;
  company?: string;
};

const SHELF_IDS = new Set<Shelf>(SHELVES.map((item) => item.id));
const FUNCTION_IDS = new Set<JobFunction>(JOB_FUNCTIONS.map((item) => item.id));

function matchesQuery(job: JobRecord, q: string) {
  if (!q) return true;
  return `${job.title}\n${job.company}\n${job.location}`.toLowerCase().includes(q);
}

export async function getBoard(filters: JobFilters) {
  await io();
  const active = db.select().from(jobs).where(eq(jobs.isActive, true)).all().filter((job) => deadlineOpen(job.deadlineAt));
  const q = filters.q?.trim().toLowerCase() ?? "";
  const shelf = filters.shelf && SHELF_IDS.has(filters.shelf as Shelf) ? (filters.shelf as Shelf) : "";
  const fn = filters.fn && FUNCTION_IDS.has(filters.fn as JobFunction) ? (filters.fn as JobFunction) : "";
  const company = filters.company?.trim() ?? "";

  const searched = active.filter((job) => matchesQuery(job, q));
  const shelfCounts = { kigali: 0, country: 0, remote: 0 };
  for (const job of searched) {
    if (company && job.company !== company) continue;
    if (fn && jobFunction(job.title) !== fn) continue;
    shelfCounts[shelfOf(job)] += 1;
  }

  const inShelf = searched.filter((job) => !shelf || shelfOf(job) === shelf);
  const functionCounts = Object.fromEntries(JOB_FUNCTIONS.map((item) => [item.id, 0])) as Record<
    JobFunction,
    number
  >;
  for (const job of inShelf) {
    if (company && job.company !== company) continue;
    functionCounts[jobFunction(job.title)] += 1;
  }

  const companyCounts = new Map<string, number>();
  for (const job of inShelf) {
    if (fn && jobFunction(job.title) !== fn) continue;
    companyCounts.set(job.company, (companyCounts.get(job.company) ?? 0) + 1);
  }

  const openings = inShelf
    .filter((job) => (!company || job.company === company) && (!fn || jobFunction(job.title) === fn))
    .sort(compareOpenings);
  const closingSoon = openings.filter((job) => {
    const kind = deadlineKind(job.deadlineAt);
    return kind === "soon" || kind === "later";
  });

  return {
    openings,
    closingSoon: closingSoon.slice(0, 5),
    shelfCounts,
    functionCounts,
    companies: [...companyCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    activeCount: active.length,
  };
}

export async function getJob(ref: string): Promise<JobRecord | null> {
  await io();
  if (!/^[0-9a-f]{16}$/.test(ref)) return null;
  const job = db.select().from(jobs).where(eq(jobs.publicId, ref)).get();
  if (!job?.isActive || !deadlineOpen(job.deadlineAt)) return null;
  return job;
}

export async function getAdminSnapshot() {
  await io();
  await restoreStudyRecords();
  const fresh = db
    .select()
    .from(jobs)
    .where(eq(jobs.isNew, true))
    .orderBy(desc(jobs.firstSeenAt))
    .limit(100)
    .all();
  const runs = db.select().from(crawlRuns).orderBy(desc(crawlRuns.id)).limit(8).all();
  const active = db
    .select({ count: sql<number>`count(*)` })
    .from(jobs)
    .where(eq(jobs.isActive, true))
    .get();
  const unseen = db
    .select({ count: sql<number>`count(*)` })
    .from(jobs)
    .where(eq(jobs.isNew, true))
    .get();

  return {
    fresh,
    runs,
    activeCount: Number(active?.count ?? 0),
    newCount: Number(unseen?.count ?? 0),
  };
}
