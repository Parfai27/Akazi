import * as cheerio from "cheerio";
import { safeHttpUrl } from "../url";
import { fetchText, sleep } from "./http";
import type { RawJob } from "./types";

const SEARCH = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search";

type ListedJob = RawJob & { companySlug: string };

function companySlugFrom(href: string | undefined): string {
  if (!href) return "";
  try {
    const match = new URL(href).pathname.match(/\/company\/([^/]+)/i);
    return match?.[1]?.toLowerCase() ?? "";
  } catch {
    return "";
  }
}

function jobsFrom(html: string): ListedJob[] {
  const $ = cheerio.load(html);
  const jobs: ListedJob[] = [];
  $(".job-search-card").each((_, element) => {
    const card = $(element);
    const urn = card.attr("data-entity-urn") ?? "";
    const id = urn.split(":").pop() ?? "";
    const title = card.find(".base-search-card__title").first().text().replace(/\s+/g, " ").trim();
    const company = card.find(".base-search-card__subtitle").first().text().replace(/\s+/g, " ").trim();
    const location = card.find(".job-search-card__location").first().text().replace(/\s+/g, " ").trim();
    const slug = companySlugFrom(card.find("a[href*='/company/']").attr("href"));
    if (!/^\d+$/.test(id) || !title || !slug) return;
    jobs.push({
      externalId: id,
      title,
      company,
      location,
      description: "",
      applyUrl: "",
      sourceUrl: "",
      postedAt: null,
      hint: /\bremote\b|home[ -]based/i.test(`${location}\n${title}`) ? "remote" : undefined,
      companySlug: slug,
    });
  });
  return jobs;
}

function companyWebsite(html: string): string | null {
  const match = html.match(/"sameAs"\s*:\s*"(https?:[^"]+)"/);
  const url = safeHttpUrl(match?.[1]);
  if (!url) return null;
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  if (/(^|\.)linkedin\.com$|(^|\.)licdn\.com$|(^|\.)bing\.com$/.test(host)) return null;
  return url;
}

async function readCompany(slug: string): Promise<string | null> {
  const response = await fetch(`https://www.linkedin.com/company/${slug}`, {
    headers: {
      accept: "text/html",
      "user-agent": "AkaziBot/1.0 (public career-page collector)",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
  });
  if (response.status === 429) throw new Error(`429 for ${slug}`);
  if (!response.ok) return null;
  return companyWebsite(await response.text());
}

export async function readLinkedIn(): Promise<RawJob[]> {
  const listed: ListedJob[] = [];
  const seen = new Set<string>();
  for (let start = 0; start < 150; start += 10) {
    const url = new URL(SEARCH);
    url.searchParams.set("location", "Rwanda");
    url.searchParams.set("start", String(start));
    let html = "";
    try {
      html = await fetchText(url.toString(), "text/html");
    } catch (error) {
      if (listed.length === 0) throw error;
      break;
    }
    const page = jobsFrom(html).filter((job) => !seen.has(job.externalId));
    if (page.length === 0) break;
    for (const job of page) {
      seen.add(job.externalId);
      listed.push(job);
    }
    await sleep(200);
  }
  if (listed.length === 0) throw new Error("LinkedIn returned no jobs");

  const websites = new Map<string, string | null>();
  let blocked = false;
  for (const slug of new Set(listed.map((job) => job.companySlug))) {
    if (blocked) break;
    await sleep(200);
    try {
      websites.set(slug, await readCompany(slug));
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.startsWith("429") || message.includes("Timeout")) {
        blocked = true;
        break;
      }
      websites.set(slug, null);
    }
  }

  const jobs: RawJob[] = [];
  for (const job of listed) {
    const applyUrl = websites.get(job.companySlug);
    if (!applyUrl) continue;
    jobs.push({
      externalId: job.externalId,
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      applyUrl,
      sourceUrl: applyUrl,
      postedAt: job.postedAt,
      hint: job.hint,
    });
  }
  if (jobs.length === 0) throw new Error("LinkedIn jobs had no employer website");
  return jobs;
}
