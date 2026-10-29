import { io } from "next/cache";
import { connection } from "next/server";
import { sqlite } from "@/db";
import { jobViewerCount } from "@/lib/record-log";
import type { ReportQuery } from "@/lib/report-range";
import { placeLabel } from "@/lib/tag";

export type ReportRow = {
  title: string;
  company: string;
  listedOn: string;
  place: string;
  status: "Open" | "Closed";
  views: number;
};

type JobSql = {
  publicId: string;
  title: string;
  company: string;
  place: string;
  sourceId: string;
  externalId: string;
  listedAt: string;
  isActive: number;
};

export async function reportOpenings(query: ReportQuery): Promise<ReportRow[]> {
  await connection();
  await io();
  const jobs = sqlite()
    .prepare(
      `SELECT public_id AS publicId, title, company, place, source_id AS sourceId, external_id AS externalId,
              first_seen_at AS listedAt, is_active AS isActive
       FROM jobs
       WHERE substr(first_seen_at, 1, 10) >= ? AND substr(first_seen_at, 1, 10) <= ?
       ORDER BY first_seen_at DESC, title`,
    )
    .all(query.from, query.to) as JobSql[];
  const chosen = jobs.filter((job) => {
    if (query.status === "open" && !job.isActive) return false;
    if (query.status === "closed" && job.isActive) return false;
    if (query.place !== "all" && job.place !== query.place) return false;
    return true;
  });
  const counted = sqlite()
    .prepare("SELECT path, COUNT(DISTINCT visitor) AS total FROM visits GROUP BY path")
    .all() as { path: string; total: number }[];
  const local = new Map(counted.map((row) => [row.path, row.total]));
  const rows: ReportRow[] = [];
  for (const job of chosen) {
    const kept = await jobViewerCount(job.sourceId, job.externalId);
    rows.push({
      title: job.title,
      company: job.company,
      listedOn: job.listedAt.slice(0, 10),
      place: placeLabel(job.place),
      status: job.isActive ? "Open" : "Closed",
      views: Math.max(kept ?? 0, local.get(`/jobs/${job.publicId}`) ?? 0),
    });
  }
  return rows;
}
