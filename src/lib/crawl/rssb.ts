import * as cheerio from "cheerio";
import { fetchText } from "./http";
import type { RawJob } from "./types";

const PAGE = "https://rssb.rw/career";
const COMPANY = "RSSB";

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function monthDayYear(value: string) {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const month = match[1].padStart(2, "0");
  const day = match[2].padStart(2, "0");
  return `${match[3]}-${month}-${day}`;
}

export async function readRssb(): Promise<RawJob[]> {
  const html = await fetchText(PAGE, "text/html");
  const $ = cheerio.load(html);
  const jobs: RawJob[] = [];

  $(".w-dyn-item").each((_, element) => {
    const row = $(element);
    const cells = row
      .find(".rtabledata")
      .map((__, cell) => clean($(cell).text()))
      .get();
    const title = cells[0] || clean(row.find(".role").text());
    const department = cells[1] ?? "";
    const status = cells[2] ?? "";
    const deadline = monthDayYear(cells[3] ?? "");
    if (title.length < 4 || !/^open$/i.test(status)) return;
    jobs.push({
      externalId: title.toLowerCase(),
      title,
      company: COMPANY,
      location: "Rwanda",
      description: department ? `Department: ${department}` : "",
      applyUrl: PAGE,
      sourceUrl: PAGE,
      postedAt: null,
      deadlineAt: deadline,
      hint: "onsite",
    });
  });

  return jobs;
}
