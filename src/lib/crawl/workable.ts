import { htmlToText } from "../html-text";
import { safeHttpUrl } from "../url";
import { fetchText, isoDate, sleep } from "./http";
import type { RawJob } from "./types";

type WorkablePlace = {
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
  hidden?: boolean;
};

type WorkableListJob = {
  title?: string;
  shortcode?: string;
  url?: string;
  application_url?: string;
  shortlink?: string;
  country?: string;
  city?: string;
  state?: string;
  created_at?: string;
  published_on?: string;
  locations?: WorkablePlace[];
};

type WorkableDetail = {
  description?: string;
  requirements?: string;
  benefits?: string;
  published?: string;
};

function rwandaLocation(job: WorkableListJob) {
  const visible = (job.locations ?? []).find((place) => place.countryCode === "RW" && place.hidden !== true);
  if (visible) {
    return [visible.city, visible.region, "Rwanda"].filter(Boolean).join(", ");
  }
  const country = job.country ?? "";
  const city = job.city ?? "";
  if (/rwanda/i.test(country) || /\bkigali\b/i.test(city)) {
    return [city, job.state, "Rwanda"].filter(Boolean).join(", ");
  }
  return "";
}

export async function readWorkable(account: string): Promise<RawJob[]> {
  const payload = JSON.parse(
    await fetchText(
      `https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(account)}`,
      "application/json",
    ),
  ) as { jobs?: WorkableListJob[] };

  const jobs: RawJob[] = [];
  for (const job of payload.jobs ?? []) {
    const title = job.title?.trim();
    const location = rwandaLocation(job);
    const applyUrl = safeHttpUrl(job.url) ?? safeHttpUrl(job.application_url) ?? safeHttpUrl(job.shortlink);
    if (!title || !location || !job.shortcode || !applyUrl) continue;

    let description = "";
    let postedAt = isoDate(job.published_on) ?? isoDate(job.created_at);
    try {
      const detail = JSON.parse(
        await fetchText(
          `https://apply.workable.com/api/v2/accounts/${encodeURIComponent(account)}/jobs/${encodeURIComponent(job.shortcode)}`,
          "application/json",
        ),
      ) as WorkableDetail;
      description = htmlToText([detail.description, detail.requirements, detail.benefits].filter(Boolean).join("\n"));
      postedAt = isoDate(detail.published) ?? postedAt;
    } catch {
      description = "";
    }

    jobs.push({
      externalId: job.shortcode,
      title,
      location,
      description,
      applyUrl,
      sourceUrl: applyUrl,
      postedAt,
      hint: "onsite",
    });
    await sleep(200);
  }
  return jobs;
}
