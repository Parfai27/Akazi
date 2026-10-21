export type RawJob = {
  externalId: string;
  title: string;
  location: string;
  description: string;
  applyUrl: string;
  sourceUrl: string;
  postedAt: string | null;
  deadlineAt?: string | null;
  hint?: "remote" | "hybrid" | "onsite";
  company?: string;
};
