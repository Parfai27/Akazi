import * as cheerio from "cheerio";
import { htmlToText } from "../html-text";
import { fetchText, sleep } from "./http";
import type { RawJob } from "./types";

const SEARCH = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search";

function jobIds(html: string): string[] {
  return [...new Set([...html.matchAll(/urn:li:jobPosting:(\d+)/g)].map((match) => match[1]))];
}

function postingFrom(html: string, id: string): RawJob | null {
  const $ = cheerio.load(html);
  const title = $(".top-card-layout__title").first().text().replace(/\s+/g, " ").trim();
  const linked = $(".topcard__org-name-link").first().text().replace(/\s+/g, " ").trim();
  const location = $(".topcard__flavor--bullet").first().text().replace(/\s+/g, " ").trim();
  const company =
    linked ||
    $(".topcard__flavor")
      .map((_, element) => $(element).text().replace(/\s+/g, " ").trim())
      .get()
      .find((flavor) => flavor && flavor !== location) ||
    "";
  const markup = $(".show-more-less-html__markup, .description__text").first().html() ?? "";
  if (!title) return null;
  const applyUrl = `https://www.linkedin.com/jobs/view/${id}`;
  return {
    externalId: id,
    title,
    company,
    location,
    description: markup ? htmlToText(markup) : "",
    applyUrl,
    sourceUrl: applyUrl,
    postedAt: null,
    hint: /\bremote\b|home[ -]based/i.test(`${location}\n${title}`) ? "remote" : undefined,
  };
}

export async function readLinkedIn(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seen = new Set<string>();
  let failures = 0;
  for (let start = 0; start < 125; start += 25) {
    const url = new URL(SEARCH);
    url.searchParams.set("location", "Rwanda");
    url.searchParams.set("start", String(start));
    const html = await fetchText(url.toString(), "text/html");
    const ids = jobIds(html).filter((id) => !seen.has(id));
    if (ids.length === 0) break;
    for (const id of ids) {
      seen.add(id);
      await sleep(100);
      try {
        const detail = await fetchText(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${id}`, "text/html");
        const job = postingFrom(detail, id);
        if (job) jobs.push(job);
      } catch (error) {
        failures += 1;
        if (failures > 5) throw error;
      }
    }
    await sleep(200);
  }
  if (jobs.length === 0) throw new Error("LinkedIn returned no jobs");
  return jobs;
}
