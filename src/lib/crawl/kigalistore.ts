import * as cheerio from "cheerio";
import { cleanPostingText, splitTitledRoles } from "../description";
import { htmlToText } from "../html-text";
import { safeHttpUrl } from "../url";
import { fetchText, isoDate, sleep } from "./http";
import type { RawJob } from "./types";

const LISTS = ["https://kigalistore.com/jobs-in-rwanda", "https://kigalistore.com/internship-in-rwanda"];

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

function jobLinks(html: string, base: string): string[] {
  const found = new Set<string>();
  for (const block of blocks(html)) {
    const items = block.itemListElement;
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const url = safeHttpUrl(typeof (item as JsonLd).url === "string" ? ((item as JsonLd).url as string) : "", base);
      if (url && /\/(?:jobs|internship)\//.test(new URL(url).pathname)) found.add(url);
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
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&rdquo;|&ldquo;/g, '"')
    .replace(/&ndash;|&mdash;/g, "-")
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

function externalSite(value: string | undefined, base: string): string | null {
  const url = safeHttpUrl(value, base);
  if (!url) return null;
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  const blocked = [
    "kigalistore.com",
    "whatsapp.com",
    "wa.me",
    "facebook.com",
    "fb.com",
    "instagram.com",
    "twitter.com",
    "x.com",
    "linkedin.com",
    "t.me",
    "youtube.com",
    "youtu.be",
    "google.com",
    "schema.org",
  ];
  if (blocked.some((name) => host === name || host.endsWith(`.${name}`))) return null;
  return url;
}

function employerLinks(html: string, pageUrl: string): string[] {
  const $ = cheerio.load(html);
  const found: string[] = [];
  const add = (href: string | undefined) => {
    const url = externalSite(href, pageUrl);
    if (url && !found.includes(url)) found.push(url);
  };
  $(".detail-apply-card a[href]").each((_, element) => add($(element).attr("href")));
  if (found.length > 0) return found;
  $(".detail-content-card a[href]").each((_, element) => add($(element).attr("href")));
  return found;
}

function postingFrom(html: string, pageUrl: string): RawJob[] {
  const job = blocks(html).find((block) => block["@type"] === "JobPosting");
  if (!job) return [];
  const title = typeof job.title === "string" ? decode(job.title).replace(/\s+/g, " ") : "";
  const links = employerLinks(html, pageUrl);
  if (!title || links.length === 0) return [];
  const description = typeof job.description === "string" ? cleanPostingText(decode(htmlToText(job.description))) : "";
  const roles = splitTitledRoles(description);
  const shared = {
    company: decode(companyOf(job)).replace(/\s+/g, " "),
    location: locationOf(job),
    postedAt: isoDate(job.datePosted),
    deadlineAt: isoDate(job.validThrough),
  };
  if (!roles || roles.length !== links.length) {
    return [{ ...shared, externalId: pageUrl, title, description, applyUrl: links[0], sourceUrl: links[0] }];
  }
  return roles.map((role, index) => ({
    ...shared,
    externalId: links[index],
    title: role.title,
    description: role.body,
    applyUrl: links[index],
    sourceUrl: links[index],
  }));
}

export async function readKigaliStore(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seen = new Set<string>();
  let failures = 0;
  for (const list of LISTS) {
    for (let page = 1; page <= 8; page += 1) {
      const listUrl = page === 1 ? list : `${list}?page=${page}`;
      const html = await fetchText(listUrl, "text/html");
      const links = jobLinks(html, listUrl).filter((link) => !seen.has(link));
      if (links.length === 0) break;
      for (const link of links) {
        seen.add(link);
        await sleep(80);
        try {
          const detail = await fetchText(link, "text/html");
          for (const job of postingFrom(detail, link)) {
            if (jobs.some((existing) => existing.externalId === job.externalId)) continue;
            jobs.push(job);
          }
        } catch (error) {
          failures += 1;
          if (failures > 5) throw error;
        }
      }
      await sleep(150);
    }
  }
  if (jobs.length === 0) throw new Error("KigaliStore returned no jobs");
  return jobs;
}
