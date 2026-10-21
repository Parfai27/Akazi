import { htmlToText } from "../html-text";
import type { WorkMode } from "../tag";
import { safeHttpUrl } from "../url";
import { fetchText, isoDate } from "./http";
import type { RawJob } from "./types";

type LeverJob = {
  id?: string;
  text?: string;
  categories?: { location?: string; allLocations?: string[] };
  workplaceType?: string;
  descriptionPlain?: string;
  description?: string;
  hostedUrl?: string;
  applyUrl?: string;
  createdAt?: number;
};

function workplaceHint(value: string | undefined): WorkMode | undefined {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("hybrid")) return "hybrid";
  if (normalized.includes("remote")) return "remote";
  if (normalized.includes("on-site") || normalized.includes("onsite") || normalized.includes("on site")) {
    return "onsite";
  }
  return undefined;
}

export async function readLever(site: string): Promise<RawJob[]> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(site)}?mode=json`;
  const payload = JSON.parse(await fetchText(url, "application/json")) as LeverJob[];
  const jobs: RawJob[] = [];

  for (const job of payload) {
    const applyUrl = safeHttpUrl(job.applyUrl) ?? safeHttpUrl(job.hostedUrl);
    const sourceUrl = safeHttpUrl(job.hostedUrl) ?? applyUrl;
    const title = job.text?.trim();
    if (!applyUrl || !sourceUrl || !title || !job.id) continue;
    const locations = job.categories?.allLocations?.filter(Boolean) ?? [];
    const location = locations.length > 0 ? locations.join("; ") : (job.categories?.location ?? "");
    const description = job.descriptionPlain?.trim()
      || (job.description ? htmlToText(job.description) : "");
    jobs.push({
      externalId: job.id,
      title,
      location,
      description,
      applyUrl,
      sourceUrl,
      postedAt: isoDate(job.createdAt),
      hint: workplaceHint(job.workplaceType),
    });
  }
  return jobs;
}
