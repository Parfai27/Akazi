import * as cheerio from "cheerio";
import { htmlToText } from "../html-text";
import { safeHttpUrl } from "../url";
import { fetchText, isoDate, sleep } from "./http";
import type { RawJob } from "./types";

const LIST = "https://kigalistore.com/jobs-in-rwanda";

type JsonLd = Record<string, unknown>;

function blocks(html: string): JsonLd[] {
  const $ = cheerio.load(html);
  const found: JsonLd[] = [];
  $("script[type='application/ld+json'], script[type=\"application/ld+json\"]").each((_, element) => {
    const raw = $(element).text().trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") found.push(parsed as JsonLd);
    } catch {
      // Ignore a broken block and keep the rest of the page.
    }
  });
  return found;
}

function jobLinks(html: string): string[] {
  const found = new Set<string>();
  for (const block of blocks(html)) {
    const items = block.itemListElement;
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const url = safeHttpUrl(typeof (item as JsonLd).url === "string" ? ((item as JsonLd).url as string) : "");
      if (url?.includes("/jobs/")) found.add(url);
    }
  }
  return [...found];
}

function decode(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .trim();
}

function countryName(value: string): string {
  return /^rw$/i.test(value) ? "Rwanda" : value;
}

function locationOf(job: JsonLd): string {
  const places = Array.isArray(job.jobLocation) ? job.jobLocation : job.jobLocation ? [job.jobLocation] : [];
  const parts: string[] = [];
  for (const place of places) {
    if (!place || typeof place !== "object") continue;
    const address = (place as JsonLd).address;
    if (!address || typeof address !== "object") continue;
    const record = address as JsonLd;
    const line = [record.addressLocality, record.addressRegion, record.addressCountry]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .map((part) => countryName(part.trim()));
    if (line.length > 0) parts.push(line.join(", "));
  }
  return parts.join("; ");
}

function companyOf(job: JsonLd): string {
  const org = job.hiringOrganization;
  if (!org || typeof org !== "object") return "";
  const name = (org as JsonLd).name;
  return typeof name === "string" ? name.trim() : "";
}

function postingFrom(html: string, pageUrl: string): RawJob | null {
  const job = blocks(html).find((block) => block["@type"] === "JobPosting");
  if (!job) return null;
  const title = typeof job.title === "string" ? decode(job.title).replace(/\s+/g, " ") : "";
  const applyUrl = safeHttpUrl(typeof job.url === "string" ? job.url : pageUrl, pageUrl);
  if (!title || !applyUrl) return null;
  const description = typeof job.description === "string" ? decode(htmlToText(job.description)) : "";
  return {
    externalId: applyUrl,
    title,
    company: decode(companyOf(job)).replace(/\s+/g, " "),
    location: locationOf(job),
    description,
    applyUrl,
    sourceUrl: applyUrl,
    postedAt: isoDate(job.datePosted),
    deadlineAt: isoDate(job.validThrough),
  };
}

export async function readKigaliStore(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seen = new Set<string>();
  let failures = 0;
  for (let page = 1; page <= 8; page += 1) {
    const listUrl = page === 1 ? LIST : `${LIST}?page=${page}`;
    const html = await fetchText(listUrl, "text/html");
    const links = jobLinks(html).filter((link) => !seen.has(link));
    if (links.length === 0) break;
    for (const link of links) {
      seen.add(link);
      await sleep(80);
      try {
        const detail = await fetchText(link, "text/html");
        const job = postingFrom(detail, link);
        if (job) jobs.push(job);
      } catch (error) {
        failures += 1;
        if (failures > 5) throw error;
      }
    }
    await sleep(150);
  }
  if (jobs.length === 0) throw new Error("KigaliStore returned no jobs");
  return jobs;
}
