import { and, eq, inArray, notInArray } from "drizzle-orm";
import { db } from "../../db";
import { crawlRuns, jobs, notifications, sources } from "../../db/schema";
import { jobSources, type JobSource } from "../sources";
import { classifyPosting, mentionsRwanda, remoteFromAnywhere } from "../tag";
import { extractDeadline } from "../url";
import { notifyNewJobs } from "../alerts";
import { restoreStudyRecords } from "../record-log";
import { readAshby } from "./ashby";
import { readGreenhouse } from "./greenhouse";
import { readHtml } from "./html";
import { readJsonLd } from "./jsonld";
import { readLever } from "./lever";
import { readAirtel } from "./airtel";
import { readBreezy } from "./breezy";
import { readMigration } from "./migration";
import { readKigaliStore } from "./kigalistore";
import { readLinkedIn } from "./linkedin";
import { readMicro1 } from "./micro1";
import { readMifotra } from "./mifotra";
import { readMtn } from "./mtn";
import { readRssb } from "./rssb";
import { readRwandAir } from "./rwandair";
import { readWorkable } from "./workable";
import type { RawJob } from "./types";

const DESCRIPTION_LIMIT = 20000;

type StoredJob = RawJob & {
  workMode: "remote" | "hybrid" | "onsite";
  place: "kigali" | "rwanda" | "remote";
};

async function readSource(source: JobSource): Promise<RawJob[]> {
  if (source.type === "greenhouse") {
    if (!source.boardToken) throw new Error("Missing Greenhouse board token");
    return readGreenhouse(source.boardToken);
  }
  if (source.type === "lever") {
    if (!source.boardToken) throw new Error("Missing Lever site name");
    return readLever(source.boardToken);
  }
  if (source.type === "jsonld") return readJsonLd(source.careerUrl);
  if (source.type === "mifotra") return readMifotra();
  if (source.type === "migration") return readMigration();
  if (source.type === "rwandair") return readRwandAir();
  if (source.type === "mtn") return readMtn();
  if (source.type === "airtel") return readAirtel();
  if (source.type === "rssb") return readRssb();
  if (source.type === "workable") {
    if (!source.boardToken) throw new Error("Missing Workable account");
    return readWorkable(source.boardToken);
  }
  if (source.type === "breezy") {
    if (!source.boardToken) throw new Error("Missing Breezy site");
    return readBreezy(source.boardToken);
  }
  if (source.type === "ashby") {
    if (!source.boardToken) throw new Error("Missing Ashby board");
    return readAshby(source.boardToken);
  }
  if (source.type === "micro1") return readMicro1();
  if (source.type === "kigalistore") return readKigaliStore();
  if (source.type === "linkedin") return readLinkedIn();
  return readHtml(source.careerUrl);
}

function keepRelevant(raw: RawJob, source: JobSource): StoredJob | null {
  const title = raw.title.trim();
  if (!title) return null;
  const description = raw.description.slice(0, DESCRIPTION_LIMIT);
  const classified = classifyPosting({
    title,
    location: raw.location,
    description,
    hint: raw.hint,
  });
  const namedInRwanda = mentionsRwanda(`${raw.location}\n${title}`);
  const openAnywhere = remoteFromAnywhere(raw.location, title);
  const allowed =
    source.scope === "rwanda"
      ? namedInRwanda
      : source.scope === "wide"
        ? namedInRwanda || openAnywhere
        : classified.relevant;
  if (!allowed) return null;
  const workMode =
    source.scope === "wide" && openAnywhere && classified.workMode === "onsite" ? "remote" : classified.workMode;
  const deadlineAt = raw.deadlineAt ?? extractDeadline(`${title}\n${description}`);
  return { ...raw, title, description, deadlineAt, workMode, place: classified.place };
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function syncSources() {
  for (const source of jobSources) {
    db.insert(sources)
      .values({
        id: source.id,
        name: source.name,
        careerUrl: source.careerUrl,
        type: source.type,
        boardToken: source.boardToken ?? null,
      })
      .onConflictDoUpdate({
        target: sources.id,
        set: {
          name: source.name,
          careerUrl: source.careerUrl,
          type: source.type,
          boardToken: source.boardToken ?? null,
        },
      })
      .run();
  }
}

function saveSourceJobs(source: JobSource, openings: StoredJob[], seenAt: string, reviewed: Set<string>) {
  const seenIds: string[] = [];
  const createdIds: number[] = [];

  db.transaction((tx) => {
    for (const opening of openings) {
      seenIds.push(opening.externalId);
      const existing = tx
        .select({ id: jobs.id })
        .from(jobs)
        .where(and(eq(jobs.sourceId, source.id), eq(jobs.externalId, opening.externalId)))
        .get();

      if (existing) {
        tx.update(jobs)
          .set({
            title: opening.title,
            company: opening.company?.trim() || source.name,
            location: opening.location,
            workMode: opening.workMode,
            place: opening.place,
            description: opening.description,
            applyUrl: opening.applyUrl,
            sourceUrl: opening.sourceUrl,
            postedAt: opening.postedAt,
            deadlineAt: opening.deadlineAt ?? null,
            lastSeenAt: seenAt,
            isActive: true,
          })
          .where(eq(jobs.id, existing.id))
          .run();
        continue;
      }

      const alreadyReviewed = reviewed.has(`${source.id}\t${opening.externalId}`);
      const inserted = tx
        .insert(jobs)
        .values({
          sourceId: source.id,
          externalId: opening.externalId,
          title: opening.title,
          company: opening.company?.trim() || source.name,
          location: opening.location,
          workMode: opening.workMode,
          place: opening.place,
          description: opening.description,
          applyUrl: opening.applyUrl,
          sourceUrl: opening.sourceUrl,
          postedAt: opening.postedAt,
          deadlineAt: opening.deadlineAt ?? null,
          firstSeenAt: seenAt,
          lastSeenAt: seenAt,
          isActive: true,
          isNew: !alreadyReviewed,
        })
        .run();
      if (!alreadyReviewed) createdIds.push(Number(inserted.lastInsertRowid));
    }

    const missing =
      seenIds.length === 0
        ? eq(jobs.sourceId, source.id)
        : and(eq(jobs.sourceId, source.id), notInArray(jobs.externalId, seenIds));
    const gone = tx.select({ id: jobs.id }).from(jobs).where(missing).all();
    const goneIds = gone.map((row) => row.id);
    if (goneIds.length > 0) {
      tx.delete(notifications).where(inArray(notifications.jobId, goneIds)).run();
      tx.delete(jobs).where(inArray(jobs.id, goneIds)).run();
    }
  });

  return createdIds;
}

function deleteClosedJobs() {
  const gone = db.select({ id: jobs.id }).from(jobs).where(eq(jobs.isActive, false)).all();
  const goneIds = gone.map((row) => row.id);
  if (goneIds.length === 0) return;
  db.delete(notifications).where(inArray(notifications.jobId, goneIds)).run();
  db.delete(jobs).where(eq(jobs.isActive, false)).run();
}

export async function crawlAll(options?: { notify?: boolean }) {
  syncSources();
  deleteClosedJobs();
  const reviewed = await restoreStudyRecords();
  const startedAt = new Date().toISOString();
  const inserted = db
    .insert(crawlRuns)
    .values({
      startedAt,
      sourcesChecked: 0,
      jobsSeen: 0,
      jobsNew: 0,
      status: "running",
    })
    .run();
  const runId = Number(inserted.lastInsertRowid);

  const notes: string[] = [];
  let jobsSeen = 0;
  let jobsNew = 0;
  let failures = 0;
  const newJobIds: number[] = [];

  for (const source of jobSources) {
    try {
      const raw = await readSource(source);
      const relevant: StoredJob[] = [];
      const seen = new Set<string>();
      for (const job of raw) {
        const kept = keepRelevant(job, source);
        if (!kept || seen.has(kept.externalId)) continue;
        seen.add(kept.externalId);
        relevant.push(kept);
      }
      const createdIds = saveSourceJobs(source, relevant, new Date().toISOString(), reviewed);
      jobsSeen += relevant.length;
      jobsNew += createdIds.length;
      newJobIds.push(...createdIds);
      notes.push(`${source.name}: ${relevant.length} open, ${createdIds.length} new`);
    } catch (error) {
      failures += 1;
      notes.push(`${source.name}: ${errorMessage(error)}`);
    }
  }

  await restoreStudyRecords();
  if (options?.notify !== false) {
    try {
      const alertNote = await notifyNewJobs(newJobIds);
      if (alertNote) notes.push(alertNote);
    } catch (error) {
      notes.push(`Alerts: ${errorMessage(error)}`);
    }
  }

  const status = failures === 0 ? "ok" : failures === jobSources.length ? "error" : "partial";
  db.update(crawlRuns)
    .set({
      finishedAt: new Date().toISOString(),
      sourcesChecked: jobSources.length,
      jobsSeen,
      jobsNew,
      status,
      notes: notes.join("\n").slice(0, 4000),
    })
    .where(eq(crawlRuns.id, runId))
    .run();

  return { status, jobsSeen, jobsNew, failures, notes };
}
