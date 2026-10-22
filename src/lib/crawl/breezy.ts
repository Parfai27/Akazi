import { htmlToText } from "../html-text";
import { safeHttpUrl } from "../url";
import { fetchText, isoDate } from "./http";
import type { RawJob } from "./types";

type BreezyJob = {
  id?: string;
  name?: string;
  url?: string;
  description?: string;
  published_date?: string;
  location?: {
    name?: string;
    city?: string;
    country?: { id?: string; name?: string } | string;
  };
};

function countryOf(job: BreezyJob) {
  const country = job.location?.country;
  if (!country) return "";
  if (typeof country === "string") return country;
  return `${country.id ?? ""} ${country.name ?? ""}`;
}

function inRwanda(job: BreezyJob) {
  const place = `${job.location?.name ?? ""} ${job.location?.city ?? ""} ${countryOf(job)}`;
  return /\brw\b/i.test(countryOf(job)) || /rwanda|kigali/i.test(place);
}

export async function readBreezy(site: string): Promise<RawJob[]> {
  const payload = JSON.parse(
    await fetchText(`https://${encodeURIComponent(site)}.breezy.hr/json`, "application/json"),
  ) as BreezyJob[] | { jobs?: BreezyJob[] };
  const rows = Array.isArray(payload) ? payload : (payload.jobs ?? []);
  const jobs: RawJob[] = [];

  for (const job of rows) {
    const title = job.name?.trim() ?? "";
    if (!title || /talent community/i.test(title) || !job.id || !inRwanda(job)) continue;
    const applyUrl = safeHttpUrl(job.url);
    if (!applyUrl) continue;

    const description = job.description ? htmlToText(job.description) : "";
    const city = job.location?.city?.trim() || job.location?.name?.trim() || "";
    const location = /rwanda/i.test(city) ? city : [city, "Rwanda"].filter(Boolean).join(", ");
    jobs.push({
      externalId: job.id,
      title,
      location,
      description,
      applyUrl,
      sourceUrl: applyUrl,
      postedAt: isoDate(job.published_date),
      hint: "onsite",
    });
  }
  return jobs;
}
