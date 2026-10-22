import { io } from "next/cache";
import { sqlite } from "@/db";
import { functionLabel, jobFunction } from "@/lib/organize";

export type OpeningRow = {
  id: number;
  title: string;
  company: string;
  role: string;
  active: boolean;
  isNew: boolean;
  deadline: string | null;
  views: number;
};

export type AlertRow = {
  id: number;
  name: string;
  email: string;
  studies: string;
  hasCv: boolean;
  createdAt: string;
};

export type SourceRow = {
  id: string;
  name: string;
  careerUrl: string;
  type: string;
  openCount: number;
  totalCount: number;
};

export type MailRow = {
  id: number;
  name: string;
  email: string;
  title: string;
  status: string;
  detail: string;
  createdAt: string;
};

export type MailSummary = { sent: number; queued: number; failed: number };

export type RecentOpen = {
  day: string;
  title: string;
  company: string;
  href: string;
  views: number;
};

type JobSql = {
  id: number;
  title: string;
  company: string;
  deadlineAt: string | null;
  isActive: number;
  isNew: number;
};

export async function getOpeningRows(): Promise<OpeningRow[]> {
  await io();
  const jobs = sqlite()
    .prepare(
      `SELECT id, title, company, deadline_at AS deadlineAt, is_active AS isActive, is_new AS isNew
       FROM jobs`,
    )
    .all() as JobSql[];
  const views = sqlite()
    .prepare("SELECT path, COUNT(*) AS views FROM visits WHERE path LIKE '/jobs/%' GROUP BY path")
    .all() as { path: string; views: number }[];
  const byId = new Map(views.map((row) => [Number(row.path.slice("/jobs/".length)), Number(row.views)]));
  return jobs
    .map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      role: functionLabel(jobFunction(job.title)),
      active: Boolean(job.isActive),
      isNew: Boolean(job.isNew),
      deadline: job.deadlineAt,
      views: byId.get(job.id) ?? 0,
    }))
    .sort((a, b) => b.views - a.views || Number(b.active) - Number(a.active) || a.title.localeCompare(b.title));
}

export async function getAlertRows(): Promise<AlertRow[]> {
  await io();
  const rows = sqlite()
    .prepare(
      `SELECT id, name, email, studies, created_at AS createdAt, length(cv_text) AS cvLength
       FROM subscribers
       ORDER BY created_at DESC`,
    )
    .all() as { id: number; name: string; email: string; studies: string; createdAt: string; cvLength: number }[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    studies: row.studies,
    hasCv: row.cvLength > 40,
    createdAt: row.createdAt,
  }));
}

export async function getSourceRows(): Promise<SourceRow[]> {
  await io();
  const sources = sqlite()
    .prepare("SELECT id, name, career_url AS careerUrl, type FROM sources ORDER BY name")
    .all() as { id: string; name: string; careerUrl: string; type: string }[];
  const counts = sqlite()
    .prepare("SELECT source_id AS sourceId, is_active AS isActive, COUNT(*) AS total FROM jobs GROUP BY source_id, is_active")
    .all() as { sourceId: string; isActive: number; total: number }[];
  return sources
    .map((source) => {
      const mine = counts.filter((row) => row.sourceId === source.id);
      return {
        ...source,
        openCount: mine.find((row) => row.isActive)?.total ?? 0,
        totalCount: mine.reduce((sum, row) => sum + row.total, 0),
      };
    })
    .sort((a, b) => b.openCount - a.openCount || a.name.localeCompare(b.name));
}

export async function getMailLog(): Promise<{ summary: MailSummary; rows: MailRow[] }> {
  await io();
  const counts = sqlite()
    .prepare("SELECT status, COUNT(*) AS total FROM notifications GROUP BY status")
    .all() as { status: string; total: number }[];
  const summary = { sent: 0, queued: 0, failed: 0 };
  for (const row of counts) {
    if (row.status === "sent" || row.status === "queued" || row.status === "failed") {
      summary[row.status] = Number(row.total);
    }
  }
  const rows = sqlite()
    .prepare(
      `SELECT n.id, n.status, n.detail, n.created_at AS createdAt, s.name, s.email, j.title
       FROM notifications n
       JOIN subscribers s ON s.id = n.subscriber_id
       LEFT JOIN jobs j ON j.id = n.job_id
       ORDER BY n.created_at DESC
       LIMIT 40`,
    )
    .all() as { id: number; status: string; detail: string | null; createdAt: string; name: string; email: string; title: string | null }[];
  return {
    summary,
    rows: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      title: row.title || "Role no longer stored",
      status: row.status,
      detail: row.detail ?? "",
      createdAt: row.createdAt,
    })),
  };
}

export async function getRecentOpens(): Promise<RecentOpen[]> {
  await io();
  const rows = sqlite()
    .prepare(
      `SELECT path, day, COUNT(*) AS views
       FROM visits
       WHERE path LIKE '/jobs/%'
       GROUP BY path, day
       ORDER BY day DESC, views DESC
       LIMIT 8`,
    )
    .all() as { path: string; day: string; views: number }[];
  const ids = rows.map((row) => Number(row.path.slice("/jobs/".length))).filter((id) => Number.isInteger(id));
  if (ids.length === 0) return [];
  const jobs = sqlite()
    .prepare(`SELECT id, title, company FROM jobs WHERE id IN (${ids.map(() => "?").join(",")})`)
    .all(...ids) as { id: number; title: string; company: string }[];
  const byId = new Map(jobs.map((job) => [job.id, job]));
  return rows.flatMap((row) => {
    const job = byId.get(Number(row.path.slice("/jobs/".length)));
    if (!job) return [];
    return [{ day: row.day, title: job.title, company: job.company, href: row.path, views: Number(row.views) }];
  });
}
