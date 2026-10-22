import { isoDate } from "./http";
import type { RawJob } from "./types";

const CAREERS = "https://careers.migration.gov.rw/";
const VACANCIES = "https://careers.migration.gov.rw/api/v1/vacancies";
const COMPANY = "Directorate General of Immigration and Emigration";
const USER_AGENT = "AkaziBot/1.0 (public career-page collector)";

type Vacancy = {
  id?: string;
  title?: string;
  location?: string;
  numberOfPositions?: number;
  applicationOpenDate?: string;
  applicationCloseDate?: string;
};

type VacancyPage = {
  content?: Vacancy[];
  totalPages?: number;
};

function openingTypes(roles: Vacancy[]) {
  return [...new Set(roles.map((role) => role.title?.trim() ?? "").filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function oneRound(close: string, roles: Vacancy[]): RawJob {
  const types = openingTypes(roles);
  const count = types.length;
  const opened = roles
    .map((role) => isoDate(role.applicationOpenDate))
    .filter((value): value is string => Boolean(value))
    .sort();
  const description = [
    "Openings at the Directorate General of Immigration and Emigration share one deadline. Choose a role and apply on the career page.",
    "",
    "Openings",
    "",
    types.join("\n"),
  ].join("\n");

  return {
    externalId: `round-${close.slice(0, 10) || "open"}`,
    title: count === 1 ? types[0] || "Open recruitment" : `Open recruitment (${count} roles)`,
    company: COMPANY,
    location: "Kigali, Rwanda",
    description,
    applyUrl: CAREERS,
    sourceUrl: CAREERS,
    postedAt: opened[0] ?? null,
    deadlineAt: close === "open" ? null : isoDate(close),
    hint: "onsite",
  };
}

async function loadPage(page: number): Promise<VacancyPage> {
  const response = await fetch(`${VACANCIES}?page=${page}&size=100`, {
    headers: { accept: "application/json", "user-agent": USER_AGENT },
    redirect: "follow",
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) throw new Error(`${response.status} for ${VACANCIES}`);
  const payload = (await response.json()) as { data?: VacancyPage };
  return payload.data ?? {};
}

export async function readMigration(): Promise<RawJob[]> {
  const rounds = new Map<string, Vacancy[]>();
  let page = 0;
  let totalPages = 1;
  while (page < totalPages && page < 10) {
    const data = await loadPage(page);
    totalPages = data.totalPages ?? 1;
    for (const role of data.content ?? []) {
      const title = role.title?.trim();
      if (!title || !role.id) continue;
      const close = role.applicationCloseDate?.trim() || "open";
      const group = rounds.get(close) ?? [];
      group.push(role);
      rounds.set(close, group);
    }
    page += 1;
  }

  return [...rounds.entries()].map(([close, roles]) => oneRound(close, roles));
}
