import * as cheerio from "cheerio";
import { htmlToText } from "../html-text";
import { safeHttpUrl } from "../url";
import { fetchText } from "./http";
import { listingLinks } from "./jsonld";
import type { RawJob } from "./types";

function splitTitle(title: string): { title: string; location: string } {
  const match = title.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (!match) return { title: title.trim(), location: "" };
  const inner = match[2].trim();
  if (/remote|hybrid|on-?site|rwanda|kigali|,/i.test(inner)) {
    return { title: match[1].trim(), location: inner };
  }
  return { title: title.trim(), location: "" };
}

function pushJob(jobs: RawJob[], seen: Set<string>, job: RawJob | null) {
  if (!job || seen.has(job.externalId)) return;
  seen.add(job.externalId);
  jobs.push(job);
}

export async function readHtml(pageUrl: string): Promise<RawJob[]> {
  const html = await fetchText(pageUrl, "text/html");
  const $ = cheerio.load(html);
  const jobs: RawJob[] = [];
  const seen = new Set<string>();

  $(".c-list-expandable__item").each((_, element) => {
    const block = $(element);
    const rawTitle = block.find("h2, h3").first().text().replace(/\s+/g, " ").trim();
    if (rawTitle.length < 4) return;
    const { title, location } = splitTitle(rawTitle);
    const content = block.find(".c-list-expandable__content");
    const description = htmlToText(content.html() ?? "");
    const href = content.find("a[href]").first().attr("href");
    const applyUrl = safeHttpUrl(href, pageUrl) ?? pageUrl;
    pushJob(jobs, seen, {
      externalId: applyUrl === pageUrl ? title : applyUrl,
      title,
      location,
      description,
      applyUrl,
      sourceUrl: pageUrl,
      postedAt: null,
    });
  });

  if (jobs.length > 0) return jobs;

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    const applyUrl = safeHttpUrl(href, pageUrl);
    if (!applyUrl || !listingLinks(`<a href="${applyUrl}"></a>`, pageUrl).includes(applyUrl)) return;
    const rawTitle = $(element).text().replace(/\s+/g, " ").trim();
    if (rawTitle.length < 8 || rawTitle.length > 140) return;
    if (/^(home|about|contact|careers|jobs|read more|apply|job description)$/i.test(rawTitle)) return;
    const { title, location } = splitTitle(rawTitle);
    pushJob(jobs, seen, {
      externalId: applyUrl,
      title,
      location,
      description: "",
      applyUrl,
      sourceUrl: applyUrl,
      postedAt: null,
    });
  });

  return jobs;
}
