import { htmlToText } from "../html-text";
import { fetchText, isoDate, sleep } from "./http";
import type { RawJob } from "./types";

const SITE = "CX_1";
const ORIGIN = "https://erey.fa.em3.oraclecloud.com";
const COMPANY = "Airtel Rwanda";

type Listing = {
  Id?: string;
  Title?: string;
  PostedDate?: string;
  PrimaryLocation?: string;
  PrimaryLocationCountry?: string;
};

function pageUrl(offset: number) {
  return `${ORIGIN}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList&finder=findReqs;siteNumber=${SITE},limit=50,offset=${offset}`;
}

function detailUrl(id: string) {
  return `${ORIGIN}/hcmRestApi/resources/latest/recruitingCEJobRequisitionDetails?expand=all&onlyData=true&finder=ById;Id=${encodeURIComponent(id)},siteNumber=${SITE}`;
}

export async function readAirtel(): Promise<RawJob[]> {
  const listings: Listing[] = [];
  let offset = 0;
  let total = 0;
  do {
    const payload = JSON.parse(await fetchText(pageUrl(offset), "application/json")) as {
      items?: { TotalJobsCount?: number; requisitionList?: Listing[] }[];
    };
    const page = payload.items?.[0];
    total = page?.TotalJobsCount ?? 0;
    listings.push(...(page?.requisitionList ?? []));
    offset += 50;
  } while (offset < total);

  const rwanda = listings.filter(
    (job) => job.PrimaryLocationCountry === "RW" || /rwanda/i.test(job.PrimaryLocation ?? ""),
  );
  const jobs: RawJob[] = [];

  for (const [index, job] of rwanda.entries()) {
    const id = job.Id?.trim();
    const title = job.Title?.trim();
    if (!id || !title) continue;
    if (index > 0) await sleep(300);
    let description = "";
    let postedAt = isoDate(job.PostedDate);
    let deadlineAt: string | null = null;
    let location = job.PrimaryLocation?.trim() || "Rwanda";
    try {
      const detail = JSON.parse(await fetchText(detailUrl(id), "application/json")) as {
        items?: Record<string, unknown>[];
      };
      const item = detail.items?.[0];
      if (item) {
        description = [item.ExternalDescriptionStr, item.ExternalResponsibilitiesStr, item.ExternalQualificationsStr]
          .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
          .map((part) => htmlToText(part))
          .filter(Boolean)
          .join("\n\n");
        postedAt = isoDate(item.ExternalPostedStartDate) ?? postedAt;
        deadlineAt = isoDate(item.ExternalPostedEndDate);
        if (typeof item.PrimaryLocation === "string" && item.PrimaryLocation.trim()) location = item.PrimaryLocation.trim();
      }
    } catch {
      description = "";
    }
    if (!/rwanda/i.test(location)) location = `${location}, Rwanda`;
    const applyUrl = `${ORIGIN}/hcmUI/CandidateExperience/en/sites/${SITE}/job/${encodeURIComponent(id)}`;
    jobs.push({
      externalId: id,
      title,
      company: COMPANY,
      location,
      description,
      applyUrl,
      sourceUrl: applyUrl,
      postedAt,
      deadlineAt,
      hint: "onsite",
    });
  }

  return jobs;
}
