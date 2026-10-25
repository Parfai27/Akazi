import * as cheerio from "cheerio";
import { htmlToText } from "../html-text";
import { safeHttpUrl } from "../url";
import { fetchText, sleep } from "./http";
import type { RawJob } from "./types";

const SEARCH = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search";

type ListedJob = RawJob & { companySlug: string };

function companySlug(href: string | undefined): string {
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
    const slug = companySlug(card.find("a[href*='/company/']").attr("href"));
    if (!/^\d+$/.test(id) || !title || !slug) return;
    const posting = `https://www.linkedin.com/jobs/view/${id}`;
    jobs.push({
      externalId: id,
      title,
      company,
      location,
      description: "",
      applyUrl: posting,
      sourceUrl: posting,
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
    await sleep(250);
  }
  if (listed.length === 0) throw new Error("LinkedIn returned no jobs");

  const websites = new Map<string, string | null>();
  for (const slug of new Set(listed.map((job) => job.companySlug))) {
    await sleep(300);
    try {
      const html = await fetchText(`https://www.linkedin.com/company/${slug}`, "text/html");
      websites.set(slug, companyWebsite(html));
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.startsWith("429")) throw error;
      websites.set(slug, null);
    }
  }

  const jobs: RawJob[] = [];
  for (const job of listed) {
    const applyUrl = websites.get(job.companySlug);
    if (!applyUrl) continue;
    const { companySlug: _slug, ...opening } = job;
    jobs.push({ ...opening, applyUrl, sourceUrl: applyUrl });
  }
  if (jobs.length === 0) throw new Error("LinkedIn jobs had no employer website");

  for (const job of jobs) {
    await sleep(300);
    try {
      const html = await fetchText(
        `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${job.externalId}`,
        "text/html",
      );
      const markup = cheerio.load(html)(".show-more-less-html__markup, .description__text").first().html();
      if (markup) job.description = htmlToText(markup);
    } catch {
      break;
    }
  }
  return jobs;
}
