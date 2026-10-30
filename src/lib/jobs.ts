import { desc, eq, sql } from "drizzle-orm";
import { cacheLife, cacheTag, io } from "next/cache";
import { db } from "@/db";
import { crawlRuns, jobs, type JobRecord } from "@/db/schema";
import { applyTips, jobGlance, jobMetaDescription, resolveApplyHref, resolveSourceHref } from "@/lib/job-copy";
import {
  JOB_FUNCTIONS,
  SHELVES,
  compareOpenings,
  deadlineKind,
  deadlineOpen,
  jobFunction,
  postedRecently,
  shelfOf,
  type JobFunction,
  type Shelf,
} from "@/lib/organize";
import { restoreStudyRecords } from "@/lib/record-log";
import { deadlineLabel, deadlineShort, formatPosted } from "@/lib/url";

export const BOARD_PAGE_SIZE = 24;

/** Used only so an empty database can still prerender the job route during a build. */
export const EMPTY_JOB_ID = "0000000000000000";

export type JobFilters = {
  q: string;
  shelf: string;
  fn: string;
  company: string;
  fresh: boolean;
  page: number;
};

export type BoardCard = {
  job: JobRecord;
  closes: string | null;
  soon: boolean;
};

export type BoardModel = {
  filters: JobFilters;
  cards: BoardCard[];
  closingSoon: BoardCard[];
  total: number;
  page: number;
  pages: number;
  freshCount: number;
  shelfCounts: Record<Shelf, number>;
  functionCounts: Record<JobFunction, number>;
};

export type JobPageData = {
  job: JobRecord;
  related: BoardCard[];
  posted: string | null;
  deadline: string;
  soon: boolean;
  metaDescription: string;
  glance: string;
  tips: string[];
  applyHref: string | null;
  sourceHref: string | null;
};

const SHELF_IDS = new Set<string>(SHELVES.map((item) => item.id));
const FUNCTION_IDS = new Set<string>(JOB_FUNCTIONS.map((item) => item.id));
const MAX_PAGE = 200;

const listedColumns = {
  id: jobs.id,
  publicId: jobs.publicId,
  sourceId: jobs.sourceId,
  externalId: jobs.externalId,
  title: jobs.title,
  company: jobs.company,
  location: jobs.location,
  workMode: jobs.workMode,
  place: jobs.place,
  applyUrl: jobs.applyUrl,
  sourceUrl: jobs.sourceUrl,
  postedAt: jobs.postedAt,
  deadlineAt: jobs.deadlineAt,
  firstSeenAt: jobs.firstSeenAt,
  lastSeenAt: jobs.lastSeenAt,
  isActive: jobs.isActive,
  isNew: jobs.isNew,
};

export function firstPageFilters(): JobFilters {
  return { q: "", shelf: "", fn: "", company: "", fresh: false, page: 1 };
}

export function normalizeFilters(input: Partial<JobFilters> | undefined): JobFilters {
  const q = input?.q?.trim() ?? "";
  const shelf = input?.shelf && SHELF_IDS.has(input.shelf) ? input.shelf : "";
  const fn = input?.fn && FUNCTION_IDS.has(input.fn) ? input.fn : "";
  const company = input?.company?.trim() ?? "";
  const fresh = Boolean(input?.fresh);
  const parsed = Number(input?.page);
  const page = Number.isFinite(parsed) && parsed > 1 ? Math.min(Math.floor(parsed), MAX_PAGE) : 1;
  return { q, shelf, fn, company, fresh, page };
}

export function boardPath(filters: JobFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.shelf) params.set("shelf", filters.shelf);
  if (filters.fn) params.set("fn", filters.fn);
  if (filters.company) params.set("company", filters.company);
  if (filters.fresh) params.set("new", "1");
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function matchesQuery(job: { title: string; company: string; location: string }, q: string) {
  if (!q) return true;
  return `${job.title}\n${job.company}\n${job.location}`.toLowerCase().includes(q);
}

function listedOpenJobs(): JobRecord[] {
  return db
    .select(listedColumns)
    .from(jobs)
    .where(eq(jobs.isActive, true))
    .all()
    .filter((job) => deadlineOpen(job.deadlineAt))
    .map((job) => ({ ...job, description: "" }));
}

function toCard(job: JobRecord): BoardCard {
  return {
    job,
    closes: deadlineShort(job.deadlineAt),
    soon: deadlineKind(job.deadlineAt) === "soon",
  };
}

export type PublicStats = {
  openings: number;
  kigali: number;
  country: number;
  remote: number;
  employers: number;
};

export async function getPublicStats(): Promise<PublicStats> {
  "use cache";
  cacheLife("hours");
  cacheTag("jobs");
  const open = listedOpenJobs();
  const counts = { kigali: 0, country: 0, remote: 0 };
  const companies = new Set<string>();
  for (const job of open) {
    counts[shelfOf(job)] += 1;
    if (job.company) companies.add(job.company);
  }
  return {
    openings: open.length,
    kigali: counts.kigali,
    country: counts.country,
    remote: counts.remote,
    employers: companies.size,
  };
}

export async function getBoard(input: Partial<JobFilters>): Promise<BoardModel> {
  return readBoard(normalizeFilters(input));
}

async function readBoard(filters: JobFilters): Promise<BoardModel> {
  "use cache";
  cacheLife("hours");
  cacheTag("jobs");

  const active = listedOpenJobs();
  const q = filters.q.toLowerCase();
  const shelf = filters.shelf as Shelf | "";
  const fn = filters.fn as JobFunction | "";
  const company = filters.company;
  const fresh = filters.fresh;
  const matchesNarrow = (job: JobRecord, options: { fn?: boolean; fresh?: boolean }) => {
    if (company && job.company !== company) return false;
    if (options.fn && fn && jobFunction(job.title) !== fn) return false;
    if (options.fresh && fresh && !postedRecently(job)) return false;
    return true;
  };

  const searched = active.filter((job) => matchesQuery(job, q));
  const shelfCounts: Record<Shelf, number> = { kigali: 0, country: 0, remote: 0 };
  for (const job of searched) {
    if (!matchesNarrow(job, { fn: true, fresh: true })) continue;
    shelfCounts[shelfOf(job)] += 1;
  }

  const inShelf = searched.filter((job) => !shelf || shelfOf(job) === shelf);
  const functionCounts = Object.fromEntries(JOB_FUNCTIONS.map((item) => [item.id, 0])) as Record<JobFunction, number>;
  let freshCount = 0;
  for (const job of inShelf) {
    if (company && job.company !== company) continue;
    functionCounts[jobFunction(job.title)] += 1;
    if (postedRecently(job)) freshCount += 1;
  }

  const openings = inShelf.filter((job) => matchesNarrow(job, { fn: true, fresh: true })).sort(compareOpenings);
  const filtering = Boolean(q || shelf || fn || company || fresh);
  const closingSoon = filtering
    ? []
    : openings
        .filter((job) => {
          const kind = deadlineKind(job.deadlineAt);
          return kind === "soon" || kind === "later";
        })
        .sort((a, b) => new Date(a.deadlineAt ?? 0).getTime() - new Date(b.deadlineAt ?? 0).getTime())
        .slice(0, 5)
        .sort(compareOpenings);
  const closingIds = new Set(closingSoon.map((job) => job.id));
  const rest = closingSoon.length > 0 ? openings.filter((job) => !closingIds.has(job.id)) : openings;
  const pages = Math.max(1, Math.ceil(rest.length / BOARD_PAGE_SIZE));
  const page = Math.min(filters.page, pages);
  const start = (page - 1) * BOARD_PAGE_SIZE;

  return {
    filters: { ...filters, page },
    cards: rest.slice(start, start + BOARD_PAGE_SIZE).map(toCard),
    closingSoon: page === 1 ? closingSoon.map(toCard) : [],
    total: openings.length,
    page,
    pages,
    freshCount,
    shelfCounts,
    functionCounts,
  };
}

function readJob(ref: string): JobRecord | null {
  if (!/^[0-9a-f]{16}$/.test(ref)) return null;
  const job = db.select().from(jobs).where(eq(jobs.publicId, ref)).get();
  if (!job?.isActive || !deadlineOpen(job.deadlineAt)) return null;
  return job;
}

function relatedCards(job: JobRecord): BoardCard[] {
  const others = listedOpenJobs().filter((item) => item.publicId !== job.publicId);
  const fn = jobFunction(job.title);
  const sameCompany = others.filter((item) => item.company === job.company).sort(compareOpenings);
  const sameWork = others
    .filter((item) => item.company !== job.company && jobFunction(item.title) === fn)
    .sort(compareOpenings);
  const picked: JobRecord[] = [];
  for (const item of [...sameCompany, ...sameWork]) {
    if (picked.length >= 3) break;
    picked.push(item);
  }
  return picked.map(toCard);
}

export async function getJob(ref: string): Promise<JobRecord | null> {
  if (!/^[0-9a-f]{16}$/.test(ref)) return null;
  return readCachedJob(ref);
}

async function readCachedJob(ref: string): Promise<JobRecord | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("jobs", `job-${ref}`);
  return readJob(ref);
}

export async function getJobPage(id: string): Promise<JobPageData | null> {
  if (!/^[0-9a-f]{16}$/.test(id)) return null;
  return readJobPage(id);
}

async function readJobPage(id: string): Promise<JobPageData | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("jobs", `job-${id}`);
  const job = readJob(id);
  if (!job) return null;
  const applyHref = resolveApplyHref(job);
  return {
    job,
    related: relatedCards(job),
    posted: formatPosted(job.postedAt),
    deadline: deadlineLabel(job.deadlineAt),
    soon: deadlineKind(job.deadlineAt) === "soon",
    metaDescription: jobMetaDescription(job),
    glance: jobGlance(job),
    tips: applyTips(job, applyHref),
    applyHref,
    sourceHref: resolveSourceHref(job),
  };
}

export type SitemapJob = { publicId: string; postedAt: string | null };

export async function listSitemapJobs(): Promise<SitemapJob[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("jobs");
  return listedOpenJobs()
    .filter((job) => /^[0-9a-f]{16}$/.test(job.publicId))
    .map((job) => ({ publicId: job.publicId, postedAt: job.postedAt }));
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
