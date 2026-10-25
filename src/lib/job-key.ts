import { createHash } from "node:crypto";

/** Stable address for a role. The database row number changes when the board is rebuilt. */
export function jobKey(sourceId: string, externalId: string) {
  return createHash("sha256").update(`${sourceId}\n${externalId}`).digest("hex").slice(0, 16);
}

export function jobPath(job: { publicId?: string | null; sourceId: string; externalId: string }) {
  return `/jobs/${job.publicId || jobKey(job.sourceId, job.externalId)}`;
}
