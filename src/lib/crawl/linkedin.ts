import * as cheerio from "cheerio";
import { htmlToText } from "../html-text";
import { fetchText, sleep } from "./http";
import type { RawJob } from "./types";

const SEARCH = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search";

function jobsFrom(html: string): RawJob[] {
  const $ = cheerio.load(html);
  const jobs: RawJob[] = [];
  $(".job-search-card").each((_, element) => {
    const card = $(element);
    const urn = card.attr("data-entity-urn") ?? "";
    const id = urn.split(":").pop() ?? "";
    const title = card.find(".base-search-card__title").first().text().replace(/\s+/g, " ").trim();
    const company = card.find(".base-search-card__subtitle").first().text().replace(/\s+/g, " ").trim();
    const location = card.find(".job-search-card__location").first().text().replace(/\s+/g, " ").trim();
    if (!/^\d+$/.test(id) || !title) return;
    const applyUrl = `https://www.linkedin.com/jobs/view/${id}`;
    jobs.push({
      externalId: id,
      title,
      company,
      location,
      description: "",
      applyUrl,
      sourceUrl: applyUrl,
      postedAt: null,
      hint: /\bremote\b|home[ -]based/i.test(`${location}\n${title}`) ? "remote" : undefined,
    });
  });
  return jobs;
}

export async function readLinkedIn(): Promise<RawJob[]> {
  const jobs: RawJob[] = [];
  const seen = new Set<string>();
  for (let start = 0; start < 150; start += 10) {
    const url = new URL(SEARCH);
    url.searchParams.set("location", "Rwanda");
    url.searchParams.set("start", String(start));
    let html = "";
    try {
      html = await fetchText(url.toString(), "text/html");
    } catch (error) {
      if (jobs.length === 0) throw error;
      break;
    }
    const page = jobsFrom(html).filter((job) => !seen.has(job.externalId));
    if (page.length === 0) break;
    for (const job of page) {
      seen.add(job.externalId);
      jobs.push(job);
    }
    await sleep(250);
  }
  if (jobs.length === 0) throw new Error("LinkedIn returned no jobs");

  for (const job of jobs) {
    await sleep(350);
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
