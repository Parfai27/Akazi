import * as cheerio from "cheerio";
import { extractText, getDocumentProxy } from "unpdf";
import { fetchText } from "./http";
import type { RawJob } from "./types";

const PORTAL = "https://erecruitment.rwandair.com/";
const COMPANY = "RwandAir";
const USER_AGENT = "AkaziBot/1.0 (public career-page collector)";

const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

type Listing = {
  id: string;
  title: string;
  experience: string;
  posted: string;
  closing: string;
  positions: string;
  location: string;
};

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function portalDate(value: string): string | null {
  const match = value.trim().match(/^(\d{4})-([A-Za-z]{3})-(\d{1,2})$/);
  if (!match) return null;
  const month = MONTHS[match[2].toLowerCase()];
  if (!month) return null;
  const iso = `${match[1]}-${month}-${match[3].padStart(2, "0")}T00:00:00.000Z`;
  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
}

function years(value: string): string | null {
  const count = Number(value.match(/\d+/)?.[0]);
  if (!Number.isFinite(count) || count <= 0) return null;
  return count === 1 ? "1 year" : `${count} years`;
}

function positions(value: string): string | null {
  const count = Number(value.replace(/\s+/g, ""));
  if (!Number.isFinite(count) || count <= 0) return null;
  return String(count);
}

function listings(html: string): Listing[] {
  const $ = cheerio.load(html);
  const rows: Listing[] = [];
  $("table tbody tr").each((_, element) => {
    const cells = $(element).find("td");
    if (cells.length < 6) return;
    const link = cells.eq(0).find("a").first();
    const id = (link.attr("href") ?? "").match(/RN\d+/)?.[0];
    const title = clean(link.text());
    const location = clean(cells.eq(5).text());
    if (!id || title.length < 2 || location.toUpperCase() !== "RWANDA") return;
    rows.push({
      id,
      title,
      experience: clean(cells.eq(1).text()),
      posted: clean(cells.eq(2).text()),
      closing: clean(cells.eq(3).text()),
      positions: clean(cells.eq(4).text()),
      location,
    });
  });
  return rows;
}

async function detailFields(id: string) {
  const page = await fetchText(new URL(`/Home/Moreinfo/${id}`, PORTAL).toString(), "text/html");
  const $ = cheerio.load(page);
  let appointment = "";
  let reportsTo = "";
  $("p").each((_, element) => {
    const text = clean($(element).text());
    const type = text.match(/^Appointment Type:\s*(.+)$/i);
    const boss = text.match(/^Reporting To:\s*(.+)$/i);
    if (type) appointment = type[1].trim();
    if (boss) reportsTo = boss[1].trim();
  });
  return { appointment, reportsTo };
}

async function quietly<T>(work: () => Promise<T>) {
  const write = console.log;
  const warn = console.warn;
  const skip = (args: unknown[]) => typeof args[0] === "string" && args[0].includes("TT:");
  console.log = (...args: unknown[]) => {
    if (!skip(args)) write(...args);
  };
  console.warn = (...args: unknown[]) => {
    if (!skip(args)) warn(...args);
  };
  try {
    return await work();
  } finally {
    console.log = write;
    console.warn = warn;
  }
}

async function pdfText(id: string) {
  const response = await fetch(`${PORTAL}Jobs/DownloadDetails?no=${encodeURIComponent(id)}`, {
    headers: { accept: "application/pdf", "user-agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) return "";
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength < 100 || bytes.byteLength > 6_000_000) return "";
  const pdf = await quietly(() => getDocumentProxy(bytes, { verbosity: 0 }));
  try {
    const extracted = await quietly(() => extractText(pdf, { mergePages: true }));
    const value = extracted.text;
    return (Array.isArray(value) ? value.join("\n") : (value ?? ""))
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } finally {
    const closable = pdf as { destroy?: () => Promise<void> | void; cleanup?: () => void };
    await closable.destroy?.();
    closable.cleanup?.();
  }
}

function locatedInKigali(text: string) {
  return /\blocation\s*:\s*[^\n]*\bkigali\b/i.test(text);
}

async function oneJob(row: Listing): Promise<RawJob> {
  const page = new URL(`/Home/Moreinfo/${row.id}`, PORTAL).toString();
  let appointment = "";
  let reportsTo = "";
  let body = "";
  try {
    const fields = await detailFields(row.id);
    appointment = fields.appointment;
    reportsTo = fields.reportsTo;
  } catch {
    appointment = "";
  }
  try {
    body = await pdfText(row.id);
  } catch {
    body = "";
  }
  const experience = years(row.experience);
  const openings = positions(row.positions);
  const description = [
    appointment ? `Appointment type: ${appointment}` : "",
    reportsTo ? `Reports to: ${reportsTo}` : "",
    experience ? `Experience: ${experience}` : "",
    openings ? `Positions: ${openings}` : "",
    body,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    externalId: row.id,
    title: row.title,
    company: COMPANY,
    location: locatedInKigali(body) ? "Kigali, Rwanda" : "Rwanda",
    description,
    applyUrl: page,
    sourceUrl: page,
    postedAt: portalDate(row.posted),
    deadlineAt: portalDate(row.closing),
    hint: "onsite",
  };
}

export async function readRwandAir(): Promise<RawJob[]> {
  const html = await fetchText(PORTAL, "text/html");
  const rows = listings(html);
  const jobs: RawJob[] = [];
  for (const row of rows) jobs.push(await oneJob(row));
  return jobs;
}
