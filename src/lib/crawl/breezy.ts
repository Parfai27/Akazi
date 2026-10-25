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

async function readDescription(job: BreezyJob, applyUrl: string): Promise<string> {
  if (job.description?.trim()) return htmlToText(job.description);
  const html = await fetchText(applyUrl, "text/html");
  const raw = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1])
    .find((script) => script.includes('"@type":"JobPosting"') || script.includes('"@type": "JobPosting"'));
  if (!raw) return "";
  const start = raw.indexOf("{");
  if (start < 0) return "";
  try {
    const posting = JSON.parse(raw.slice(start)) as { description?: string };
    return posting.description ? htmlToText(posting.description) : "";
  } catch {
    return "";
  }
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
  let rwandaRoles = 0;

  for (const job of rows) {
    const title = job.name?.trim() ?? "";
    if (!title || /talent community/i.test(title) || !job.id || !inRwanda(job)) continue;
    const applyUrl = safeHttpUrl(job.url);
    if (!applyUrl) continue;
    rwandaRoles += 1;

    const description = await readDescription(job, applyUrl);
    if (description.trim().length < 40) continue;
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
  if (rwandaRoles > 0 && jobs.length === 0) throw new Error("Breezy roles had no description");
  return jobs;
}
