import * as cheerio from "cheerio";
import { htmlToText } from "../html-text";
import type { WorkMode } from "../tag";
import { safeHttpUrl } from "../url";
import { asArray, fetchText, isoDate, sleep } from "./http";
import type { RawJob } from "./types";

const DETAIL_LIMIT = 30;

type JsonLd = Record<string, unknown>;

function typeNames(node: JsonLd): string[] {
  return asArray(node["@type"]).map((value) => String(value));
}

function collectPostings(node: unknown, found: JsonLd[]) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) collectPostings(item, found);
    return;
  }
  const record = node as JsonLd;
  if (typeNames(record).includes("JobPosting")) found.push(record);
  if (record["@graph"]) collectPostings(record["@graph"], found);
  if (record.itemListElement) collectPostings(record.itemListElement, found);
  if (record.item) collectPostings(record.item, found);
}

function placeText(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(placeText).filter(Boolean).join("; ");
  if (typeof value !== "object") return "";
  const record = value as JsonLd;
  if (typeof record.name === "string" && !record.address) return record.name;
  const address = record.address;
  if (typeof address === "string") return address;
  if (address && typeof address === "object") {
    const addr = address as JsonLd;
    return [addr.addressLocality, addr.addressRegion, addr.addressCountry]
      .filter((part) => typeof part === "string" && part)
      .join(", ");
  }
  return typeof record.name === "string" ? record.name : "";
}

function externalIdOf(job: JsonLd, pageUrl: string): string {
  const identifier = job.identifier;
  if (typeof identifier === "string" && identifier.trim()) return identifier.trim();
  if (identifier && typeof identifier === "object") {
    const record = identifier as JsonLd;
    const value = record.value ?? record.name;
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return pageUrl;
}

function workHint(job: JsonLd): WorkMode | undefined {
  const types = asArray(job.jobLocationType).map((value) => String(value).toUpperCase());
  if (types.some((type) => type.includes("TELECOMMUTE"))) return "remote";
  return undefined;
}

function postingsFromHtml(html: string, pageUrl: string): RawJob[] {
  const $ = cheerio.load(html);
  const nodes: JsonLd[] = [];
  $("script[type='application/ld+json'], script[type=\"application/ld+json\"]").each((_, element) => {
    const raw = $(element).text().trim();
    if (!raw) return;
    try {
      collectPostings(JSON.parse(raw), nodes);
    } catch {
      // Ignore broken JSON-LD blocks and keep any valid ones.
    }
  });

  const jobs: RawJob[] = [];
  for (const job of nodes) {
    const title = typeof job.title === "string" ? job.title.trim() : "";
    const url = safeHttpUrl(typeof job.url === "string" ? job.url : pageUrl, pageUrl);
    if (!title || !url) continue;
    const description = typeof job.description === "string" ? htmlToText(job.description) : "";
    const location = [
      placeText(job.jobLocation),
      placeText(job.applicantLocationRequirements),
    ]
      .filter(Boolean)
      .join("; ");
    jobs.push({
      externalId: externalIdOf(job, url),
      title,
      location,
      description,
      applyUrl: url,
      sourceUrl: url,
      postedAt: isoDate(job.datePosted),
      deadlineAt: isoDate(job.validThrough),
      hint: workHint(job),
    });
  }
  return jobs;
}

export function listingLinks(html: string, pageUrl: string): string[] {
  const $ = cheerio.load(html);
  const base = new URL(pageUrl);
  const basePath = base.pathname.replace(/\/$/, "");
  const found = new Set<string>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    let url: URL;
    try {
      url = new URL(href, base);
    } catch {
      return;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return;
    if (url.host !== base.host) return;
    url.hash = "";
    const path = url.pathname.replace(/\/$/, "");
    if (!path || path === basePath) return;
    const child = path.startsWith(`${basePath}/`);
    const jobish = /job|vacanc|opening|position|opportunit/i.test(path);
    if (!child && !jobish) return;
    if (/\.(pdf|png|jpe?g|gif|svg|css|js|zip|webp)$/i.test(path)) return;
    found.add(url.toString());
  });

  return [...found].slice(0, DETAIL_LIMIT);
}

export async function readJsonLd(pageUrl: string): Promise<RawJob[]> {
  const html = await fetchText(pageUrl, "text/html");
  const direct = postingsFromHtml(html, pageUrl);
  if (direct.length > 0) return direct;

  const jobs: RawJob[] = [];
  const seen = new Set<string>();
  for (const link of listingLinks(html, pageUrl)) {
    await sleep(150);
    try {
      const detailHtml = await fetchText(link, "text/html");
      for (const job of postingsFromHtml(detailHtml, link)) {
        if (seen.has(job.externalId)) continue;
        seen.add(job.externalId);
        jobs.push(job);
      }
    } catch {
      // A single detail page can fail without dropping the rest of the board.
    }
  }
  return jobs;
}
