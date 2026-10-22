import type { WorkMode } from "../tag";
import { htmlToText } from "../html-text";
import { safeHttpUrl } from "../url";
import { fetchText, isoDate } from "./http";
import type { RawJob } from "./types";

type AshbyPlace = { location?: string } | string;

type AshbyJob = {
  id?: string;
  title?: string;
  location?: string;
  secondaryLocations?: AshbyPlace[];
  isListed?: boolean;
  isRemote?: boolean;
  workplaceType?: string;
  jobUrl?: string;
  applyUrl?: string;
  descriptionPlain?: string;
  descriptionHtml?: string;
  publishedAt?: string;
};

function placeName(place: AshbyPlace) {
  if (typeof place === "string") return place.trim();
  return place.location?.trim() ?? "";
}

function workplaceHint(job: AshbyJob): WorkMode | undefined {
  const workplace = job.workplaceType ?? "";
  if (job.isRemote || /remote/i.test(workplace)) return "remote";
  if (/hybrid/i.test(workplace)) return "hybrid";
  return undefined;
}

export async function readAshby(board: string): Promise<RawJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board)}`;
  const payload = JSON.parse(await fetchText(url, "application/json")) as { jobs?: AshbyJob[] };
  const jobs: RawJob[] = [];

  for (const job of payload.jobs ?? []) {
    if (job.isListed === false) continue;
    const applyUrl = safeHttpUrl(job.applyUrl) ?? safeHttpUrl(job.jobUrl);
    const sourceUrl = safeHttpUrl(job.jobUrl) ?? applyUrl;
    const title = job.title?.trim();
    if (!applyUrl || !sourceUrl || !title || !job.id) continue;
    const places = [job.location, ...(job.secondaryLocations ?? []).map(placeName)].filter((place): place is string => Boolean(place));
    let location = places.join("; ");
    if (job.isRemote && !/\bremote\b/i.test(location)) location = location ? `Remote, ${location}` : "Remote";
    const description = job.descriptionPlain?.trim() || (job.descriptionHtml ? htmlToText(job.descriptionHtml) : "");
    jobs.push({
      externalId: job.id,
      title,
      location,
      description,
      applyUrl,
      sourceUrl,
      postedAt: isoDate(job.publishedAt),
      hint: workplaceHint(job),
    });
  }
  return jobs;
}
