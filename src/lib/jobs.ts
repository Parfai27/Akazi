import { desc, eq, sql } from "drizzle-orm";
import { cacheLife, cacheTag, io } from "next/cache";
import { db } from "@/db";
import { crawlRuns, jobs, type JobRecord } from "@/db/schema";
import { applyTips, jobGlance, jobMetaDescription, resolveApplyHref, resolveSourceHref } from "@/lib/job-copy";
import {
  JOB_FUNCTIONS,
  POSTED_WINDOWS,
  SHELVES,
  compareOpenings,
  daysLeft,
  deadlineKind,
  deadlineOpen,
  jobFunction,
  postedRecently,
  postedWithin,
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
  /** Posted within this many days; 0 means any time. */
  posted: number;
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
  postedCounts: Record<number, number>;
  shelfCounts: Record<Shelf, number>;
  functionCounts: Record<JobFunction, number>;
};

export type RelatedCard = BoardCard & { fresh: boolean };

export type JobPageData = {
  job: JobRecord;
  related: RelatedCard[];
  companySlug: string;
  posted: string | null;
  deadline: string;
  daysLeft: number | null;
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
  return { q: "", shelf: "", fn: "", company: "", posted: 0, page: 1 };
}

export function normalizeFilters(input: Partial<JobFilters> | undefined): JobFilters {
  const q = input?.q?.trim() ?? "";
  const shelf = input?.shelf && SHELF_IDS.has(input.shelf) ? input.shelf : "";
  const fn = input?.fn && FUNCTION_IDS.has(input.fn) ? input.fn : "";
  const company = input?.company?.trim() ?? "";
  const posted = (POSTED_WINDOWS as readonly number[]).includes(Number(input?.posted)) ? Number(input?.posted) : 0;
  const parsed = Number(input?.page);
  const page = Number.isFinite(parsed) && parsed > 1 ? Math.min(Math.floor(parsed), MAX_PAGE) : 1;
  return { q, shelf, fn, company, posted, page };
}

export function boardPath(filters: JobFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.shelf) params.set("shelf", filters.shelf);
  if (filters.fn) params.set("fn", filters.fn);
  if (filters.company) params.set("company", filters.company);
  if (filters.posted) params.set("posted", String(filters.posted));
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

/** When the crawler last finished a run, so pages can say how fresh the openings are. */
export async function getLastUpdate(): Promise<string | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("jobs");
  const run = db
    .select({ finishedAt: crawlRuns.finishedAt })
    .from(crawlRuns)
    .where(sql`${crawlRuns.finishedAt} is not null`)
    .orderBy(desc(crawlRuns.finishedAt))
    .limit(1)
    .get();
  return run?.finishedAt ?? null;
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
  const posted = filters.posted;
  const matchesNarrow = (job: JobRecord, options: { fn?: boolean; posted?: boolean }) => {
    if (company && job.company !== company) return false;
    if (options.fn && fn && jobFunction(job.title) !== fn) return false;
    if (options.posted && posted && !postedWithin(job, posted)) return false;
    return true;
  };

  const searched = active.filter((job) => matchesQuery(job, q));
  const shelfCounts: Record<Shelf, number> = { kigali: 0, country: 0, remote: 0 };
  for (const job of searched) {
    if (!matchesNarrow(job, { fn: true, posted: true })) continue;
    shelfCounts[shelfOf(job)] += 1;
  }

  const inShelf = searched.filter((job) => !shelf || shelfOf(job) === shelf);
  const functionCounts = Object.fromEntries(JOB_FUNCTIONS.map((item) => [item.id, 0])) as Record<JobFunction, number>;
  const postedCounts: Record<number, number> = Object.fromEntries(POSTED_WINDOWS.map((days) => [days, 0]));
  for (const job of inShelf) {
    if (company && job.company !== company) continue;
    if (!posted || postedWithin(job, posted)) functionCounts[jobFunction(job.title)] += 1;
    if (fn && jobFunction(job.title) !== fn) continue;
    for (const days of POSTED_WINDOWS) if (postedWithin(job, days)) postedCounts[days] += 1;
  }

  const openings = inShelf.filter((job) => matchesNarrow(job, { fn: true, posted: true })).sort(compareOpenings);
  const filtering = Boolean(q || shelf || fn || company || posted);
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
    postedCounts,
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

const RELATED_LIMIT = 6;

function relatedCards(job: JobRecord): RelatedCard[] {
  const others = listedOpenJobs().filter((item) => item.publicId !== job.publicId);
  const fn = jobFunction(job.title);
  const shelf = shelfOf(job);
  const sameCompany = others.filter((item) => item.company === job.company).sort(compareOpenings);
  const sameWork = others
    .filter((item) => item.company !== job.company && jobFunction(item.title) === fn)
    // Same kind of work in the same place first, then anywhere.
    .sort((a, b) => Number(shelfOf(b) === shelf) - Number(shelfOf(a) === shelf) || compareOpenings(a, b));
  const picked: JobRecord[] = [];
  for (const item of [...sameCompany.slice(0, 2), ...sameWork, ...sameCompany.slice(2)]) {
    if (picked.length >= RELATED_LIMIT) break;
    picked.push(item);
  }
  return picked.map((item) => ({ ...toCard(item), fresh: postedRecently(item) }));
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
  const sourceHref = resolveSourceHref(job);
  return {
    job,
    related: relatedCards(job),
    companySlug: companySlug(job.company),
    posted: formatPosted(job.postedAt),
    deadline: deadlineLabel(job.deadlineAt),
    daysLeft: daysLeft(job.deadlineAt),
    soon: deadlineKind(job.deadlineAt) === "soon",
    metaDescription: jobMetaDescription(job),
    glance: jobGlance(job),
    tips: applyTips(job, applyHref, sourceHref),
    applyHref,
    sourceHref,
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

/** A stable URL part for an employer name, such as "mtn-rwanda". */
export function companySlug(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "company"
  );
}

export type CompanySummary = {
  slug: string;
  name: string;
  count: number;
  website: string;
  places: string[];
};

export type CompanyPageData = CompanySummary & {
  cards: BoardCard[];
  functions: { id: JobFunction; count: number }[];
  shelves: Record<Shelf, number>;
};

function companiesFrom(open: JobRecord[]) {
  const byName = new Map<string, JobRecord[]>();
  for (const job of open) {
    if (!job.company.trim()) continue;
    byName.set(job.company, [...(byName.get(job.company) ?? []), job]);
  }
  return byName;
}

function summarize(name: string, list: JobRecord[]): CompanySummary {
  const places = [
    ...new Set(list.map((job) => (job.workMode === "remote" ? "Remote" : job.location.split(",")[0].trim())).filter(Boolean)),
  ];
  return { slug: companySlug(name), name, count: list.length, website: list[0]?.applyUrl ?? "", places: places.slice(0, 3) };
}

export async function listCompanies(): Promise<CompanySummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("jobs");
  return [...companiesFrom(listedOpenJobs()).entries()]
    .map(([name, list]) => summarize(name, list))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getCompanyPage(slug: string): Promise<CompanyPageData | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  return readCompanyPage(slug);
}

async function readCompanyPage(slug: string): Promise<CompanyPageData | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("jobs");
  const entry = [...companiesFrom(listedOpenJobs()).entries()].find(([name]) => companySlug(name) === slug);
  if (!entry) return null;
  const [name, list] = entry;
  const functions = JOB_FUNCTIONS.map((item) => ({
    id: item.id,
    count: list.filter((job) => jobFunction(job.title) === item.id).length,
  })).filter((item) => item.count > 0);
  const shelves: Record<Shelf, number> = { kigali: 0, country: 0, remote: 0 };
  for (const job of list) shelves[shelfOf(job)] += 1;
  return { ...summarize(name, list), cards: [...list].sort(compareOpenings).map(toCard), functions, shelves };
}
