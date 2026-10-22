export type SourceType =
  | "greenhouse"
  | "lever"
  | "jsonld"
  | "html"
  | "mifotra"
  | "migration"
  | "rwandair"
  | "mtn"
  | "airtel"
  | "rssb";

export type JobSource = {
  id: string;
  name: string;
  careerUrl: string;
  type: SourceType;
  /**
   * Greenhouse board token or Lever site name.
   * Example: boards-api.greenhouse.io/v1/boards/{boardToken}
   * Example: api.lever.co/v0/postings/{boardToken}
   */
  boardToken?: string;
  /**
   * On a worldwide board, keep a role only when its title or location names Rwanda.
   */
  scope?: "rwanda";
};

/**
 * Companies whose public career pages we check.
 * Add a row to follow another employer. The crawl picks it up on the next run.
 *
 * type:
 * - greenhouse: boardToken is the token in boards-api.greenhouse.io/v1/boards/{token}/jobs
 * - lever: boardToken is the site name in api.lever.co/v0/postings/{token}
 * - jsonld: careerUrl is a page with schema.org JobPosting JSON-LD, or a listing
 *   that links to pages containing that markup
 * - html: careerUrl is a listing page with no feed; job titles are read from the HTML
 * - mifotra: the public Rwanda civil-service portal. No board token.
 * - migration: the Directorate General of Immigration and Emigration career page.
 *   Roles that share a deadline are stored as one opening.
 * - rwandair: the RwandAir recruitment portal. Each Rwanda vacancy is one opening.
 * - mtn: the MTN Rwanda careers API. Closed deadlines are left off.
 * - airtel: Airtel Africa's public board, kept only when the role is in Rwanda.
 * - rssb: the RSSB careers table. A row is kept when its status is Open.
 *
 * Example:
 * { id: "acme", name: "Acme", careerUrl: "https://example.com/careers", type: "jsonld" }
 */
export const jobSources: JobSource[] = [
  {
    id: "one-acre-fund-rwanda",
    name: "One Acre Fund Rwanda",
    careerUrl: "https://job-boards.greenhouse.io/oneacrefundrwanda",
    type: "greenhouse",
    boardToken: "oneacrefundrwanda",
  },
  {
    id: "alx-africa",
    name: "ALX Africa",
    careerUrl: "https://job-boards.greenhouse.io/alxafrica",
    type: "greenhouse",
    boardToken: "alxafrica",
  },
  {
    id: "african-leadership-university",
    name: "African Leadership University",
    careerUrl: "https://job-boards.greenhouse.io/alu",
    type: "greenhouse",
    boardToken: "alu",
  },
  {
    id: "zipline",
    name: "Zipline",
    careerUrl: "https://job-boards.greenhouse.io/flyzipline",
    type: "greenhouse",
    boardToken: "flyzipline",
  },
  {
    id: "world-relief",
    name: "World Relief",
    careerUrl: "https://jobs.lever.co/wr",
    type: "lever",
    boardToken: "wr",
  },
  {
    id: "bridge-talent",
    name: "BRIDGE Talent Services",
    careerUrl: "https://jobs.lever.co/bridge2rwanda",
    type: "lever",
    boardToken: "bridge2rwanda",
  },
  {
    id: "global-health-corps",
    name: "Global Health Corps",
    careerUrl: "https://jobs.lever.co/ghcorps",
    type: "lever",
    boardToken: "ghcorps",
  },
  {
    id: "zenysis",
    name: "Zenysis",
    careerUrl: "https://join.com/companies/zenysiscom",
    type: "jsonld",
  },
  {
    id: "laterite",
    name: "Laterite",
    careerUrl: "https://www.laterite.com/vacancies/",
    type: "html",
  },
  {
    id: "one-acre-fund",
    name: "One Acre Fund",
    careerUrl: "https://job-boards.greenhouse.io/oneacrefund",
    type: "greenhouse",
    boardToken: "oneacrefund",
    scope: "rwanda",
  },
  {
    id: "government-of-rwanda",
    name: "Government of Rwanda",
    careerUrl: "https://recruitment.mifotra.gov.rw/Vacancies",
    type: "mifotra",
  },
  {
    id: "migration-office",
    name: "Directorate General of Immigration and Emigration",
    careerUrl: "https://careers.migration.gov.rw/",
    type: "migration",
  },
  {
    id: "rwandair",
    name: "RwandAir",
    careerUrl: "https://erecruitment.rwandair.com/",
    type: "rwandair",
  },
  {
    id: "mtn-rwanda",
    name: "MTN Rwanda",
    careerUrl: "https://careers.mtn.co.rw/",
    type: "mtn",
  },
  {
    id: "airtel-rwanda",
    name: "Airtel Rwanda",
    careerUrl: "https://www.airtel.co.rw/career",
    type: "airtel",
  },
  {
    id: "rssb",
    name: "RSSB",
    careerUrl: "https://rssb.rw/career",
    type: "rssb",
  },
  {
    id: "irembo",
    name: "Irembo",
    careerUrl: "https://irembo.com/careers/",
    type: "greenhouse",
    boardToken: "iremboltd",
  },
];
