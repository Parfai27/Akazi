import zlib from "node:zlib";
import { htmlToText } from "../html-text";
import { isoDate } from "./http";
import type { RawJob } from "./types";

const ADVERTISEMENTS = "https://recruitment.mifotra.gov.rw/api/recruitment/open-advertisements";
const USER_AGENT = "AkaziBot/1.0 (public career-page collector)";

type Advertisement = {
  id?: string | number;
  positionName?: string;
  unitName?: string;
  entityName?: string;
  jobDescriptions?: string;
  openingDate?: string;
  closingDate?: string;
  isInternal?: boolean;
};

function line(parts: Array<string | undefined>) {
  const unique = [...new Set(parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part)))];
  return unique.join(", ");
}

export async function readMifotra(): Promise<RawJob[]> {
  const response = await fetch(ADVERTISEMENTS, {
    headers: { accept: "application/json", "user-agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error(`${response.status} for ${ADVERTISEMENTS}`);
  const payload = (await response.json()) as { _data_?: Record<string, number> };
  const bytes = payload._data_ ? Object.values(payload._data_) : [];
  if (bytes.length < 2) throw new Error("MIFOTRA response was not readable");
  const decoded = zlib.inflateSync(Buffer.from(bytes)).toString("utf8");
  const advertisements = JSON.parse(decoded) as Advertisement[];
  if (!Array.isArray(advertisements)) throw new Error("MIFOTRA advertisements were not a list");

  const jobs: RawJob[] = [];
  for (const advert of advertisements) {
    const title = advert.positionName?.trim();
    if (!title || advert.id == null || advert.isInternal) continue;
    const applyUrl = `https://recruitment.mifotra.gov.rw/Vacancies/Details/${advert.id}`;
    const description = advert.jobDescriptions ? htmlToText(advert.jobDescriptions) : "";
    jobs.push({
      externalId: String(advert.id),
      title,
      company: advert.entityName?.trim() || "Government of Rwanda",
      location: line([advert.unitName, advert.entityName, "Rwanda"]),
      description,
      applyUrl,
      sourceUrl: applyUrl,
      postedAt: isoDate(advert.openingDate),
      deadlineAt: isoDate(advert.closingDate),
    });
  }
  return jobs;
}
