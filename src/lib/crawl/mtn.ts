import { fetchText, isoDate } from "./http";
import type { RawJob } from "./types";

const ORIGIN = "https://careers.mtn.co.rw";
const COMPANY = "MTN Rwanda";

function text(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function rows(payload: unknown): Record<string, unknown>[] {
  const found: unknown[] = [];
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      if (value.some((item) => item && typeof item === "object" && ("positionTitle" in item || "jobTitle" in item || "title" in item))) {
        found.push(...value);
      }
      return;
    }
    const record = value as Record<string, unknown>;
    for (const key of ["data", "rows", "items", "jobs", "results", "content"]) visit(record[key]);
  };
  visit(payload);
  return found.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
}

function kigaliToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kigali",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function readMtn(): Promise<RawJob[]> {
  const payload = JSON.parse(await fetchText(`${ORIGIN}/api/jobs`, "application/json")) as unknown;
  const today = kigaliToday();
  const jobs: RawJob[] = [];

  for (const job of rows(payload)) {
    const id = text(job.id) || text(job.jobId) || text(job._id);
    const title = text(job.positionTitle) || text(job.jobTitle) || text(job.title);
    if (!id || title.length < 3) continue;
    const deadline = isoDate(job.applicationDeadline ?? job.applicationdeadline ?? job.closingDate ?? job.deadline);
    if (deadline && deadline.slice(0, 10) < today) continue;
    const city = text(job.city);
    const region = text(job.region);
    const place = [city, region].filter(Boolean).join(", ");
    const location = /rwanda/i.test(place) ? place : place ? `${place}, Rwanda` : "Rwanda";
    const department = text(job.departmentName) || text(job.department) || text(job.unit);
    const description = [department ? `Department: ${department}` : "", text(job.description), text(job.mission)]
      .filter(Boolean)
      .join("\n\n");
    jobs.push({
      externalId: id,
      title,
      company: COMPANY,
      location,
      description,
      applyUrl: `${ORIGIN}/jobs/${encodeURIComponent(id)}`,
      sourceUrl: `${ORIGIN}/jobs/${encodeURIComponent(id)}`,
      postedAt: isoDate(job.createdAt ?? job.publishedAt ?? job.postedAt),
      deadlineAt: deadline,
      hint: "onsite",
    });
  }

  return jobs;
}
