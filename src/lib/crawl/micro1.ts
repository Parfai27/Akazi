import { htmlToText } from "../html-text";
import { safeHttpUrl } from "../url";
import { isoDate, sleep } from "./http";
import type { RawJob } from "./types";

const PORTAL = "https://prod-api.micro1.ai/api/v1/job/portal";

type ListedJob = { job_id?: string };

type Detail = {
  job_id?: string;
  job_name?: string;
  job_description?: string;
  date_posted?: string;
  apply_url?: string;
  location_name?: string;
};

type PortalResponse<T> = { data?: T; total?: number };

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "user-agent": "AkaziBot/1.0 (public career-page collector)",
    },
    body: JSON.stringify(body),
    redirect: "follow",
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return response.json() as Promise<T>;
}

function locationFrom(detail: Detail): string {
  const named = detail.location_name?.trim();
  if (named) return named;
  const match = detail.job_description?.match(/Location:\s*(?:<\/[^>]+>\s*)*([^<]{1,180})/i);
  if (!match) return "";
  return match[1]
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/worlwide/gi, "worldwide")
    .replace(/\s+/g, " ")
    .trim();
}

export async function readMicro1(): Promise<RawJob[]> {
  const listed: ListedJob[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const payload = await postJson<PortalResponse<ListedJob[]>>(`${PORTAL}?page=${page}&limit=50&keyword=`, {
      action: "get_all_jobs",
      filters: { type: ["EXPERT"] },
    });
    const batch = payload.data ?? [];
    listed.push(...batch);
    if (batch.length === 0 || listed.length >= (payload.total ?? listed.length)) break;
    await sleep(150);
  }

  const jobs: RawJob[] = [];
  for (const item of listed) {
    if (!item.job_id) continue;
    const payload = await postJson<PortalResponse<Detail>>(`${PORTAL}?job_id=${encodeURIComponent(item.job_id)}`, {
      action: "get_job_details",
      job_id: item.job_id,
    });
    const detail = payload.data;
    const title = detail?.job_name?.trim();
    const applyUrl = safeHttpUrl(detail?.apply_url);
    if (!detail?.job_id || !title || !applyUrl) continue;
    const location = locationFrom(detail);
    jobs.push({
      externalId: detail.job_id,
      title,
      location,
      description: detail.job_description ? htmlToText(detail.job_description) : "",
      applyUrl,
      sourceUrl: applyUrl,
      postedAt: isoDate(detail.date_posted),
      hint: /\bremote\b|anywhere|worldwide|home[ -]based/i.test(location) ? "remote" : undefined,
    });
    await sleep(30);
  }
  return jobs;
}
