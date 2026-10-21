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

function postLabel(count: number) {
  return `${count} ${count === 1 ? "post" : "posts"}`;
}

function roleLine(role: Vacancy) {
  const title = role.title?.trim() ?? "";
  const posts = role.numberOfPositions && role.numberOfPositions > 0 ? postLabel(role.numberOfPositions) : "";
  const where = role.location?.trim() ?? "";
  return [title, posts, where].filter(Boolean).join(", ");
}

function oneRound(close: string, roles: Vacancy[]): RawJob {
  const ordered = [...roles].sort(
    (a, b) => (b.numberOfPositions ?? 0) - (a.numberOfPositions ?? 0) || (a.title ?? "").localeCompare(b.title ?? ""),
  );
  const count = ordered.length;
  const opened = ordered
    .map((role) => isoDate(role.applicationOpenDate))
    .filter((value): value is string => Boolean(value))
    .sort();
  const lines = ordered.map(roleLine).filter(Boolean);
  const description = [
    `${count} ${count === 1 ? "role is" : "roles are"} open at the Directorate General of Immigration and Emigration. They share one deadline. Choose a role and apply on the career page.`,
    "",
    "Roles",
    "",
    lines.join("\n"),
  ].join("\n");

  return {
    externalId: `round-${close.slice(0, 10) || "open"}`,
    title: count === 1 ? ordered[0].title?.trim() || "Open recruitment" : `Open recruitment (${count} roles)`,
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
