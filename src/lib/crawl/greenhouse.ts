import { htmlToText } from "../html-text";
import { safeHttpUrl } from "../url";
import { fetchText, isoDate } from "./http";
import type { RawJob } from "./types";

type GreenhouseJob = {
  id?: number | string;
  title?: string;
  absolute_url?: string;
  location?: { name?: string };
  content?: string;
  first_published?: string;
  updated_at?: string;
  application_deadline?: string | null;
};

export async function readGreenhouse(boardToken: string): Promise<RawJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(boardToken)}/jobs?content=true`;
  const payload = JSON.parse(await fetchText(url, "application/json")) as {
    jobs?: GreenhouseJob[];
  };

  const jobs: RawJob[] = [];
  for (const job of payload.jobs ?? []) {
    const applyUrl = safeHttpUrl(job.absolute_url);
    const title = job.title?.trim();
    if (!applyUrl || !title || job.id == null) continue;
    jobs.push({
      externalId: String(job.id),
      title,
      location: job.location?.name?.trim() ?? "",
      description: job.content ? htmlToText(job.content) : "",
      applyUrl,
      sourceUrl: applyUrl,
      postedAt: isoDate(job.first_published) ?? isoDate(job.updated_at),
      deadlineAt: isoDate(job.application_deadline),
    });
  }
  return jobs;
}
