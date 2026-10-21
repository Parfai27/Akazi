import { and, eq, inArray, ne } from "drizzle-orm";
import nodemailer from "nodemailer";
import { db } from "../db";
import { jobs, notifications, subscribers, type JobRecord, type SubscriberRecord } from "../db/schema";
import { matchesProfile } from "./match";
import { deadlineLabel } from "./url";

export type AlertResult = {
  matched: number;
  sent: number;
  queued: number;
};

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM);
}

function siteUrl() {
  return (process.env.SITE_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000").replace(/\/$/, "");
}

async function deliver(to: string, subject: string, text: string) {
  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
  });
}

function remember(subscriberId: number, jobId: number, status: string, detail: string | null, now: string) {
  db.insert(notifications)
    .values({ subscriberId, jobId, status, detail, createdAt: now })
    .onConflictDoUpdate({
      target: [notifications.subscriberId, notifications.jobId],
      set: { status, detail },
    })
    .run();
}

function emailBody(person: SubscriberRecord, openings: JobRecord[]) {
  const lines = openings.map((job) => {
    return [
      `${job.title} — ${job.company}`,
      deadlineLabel(job.deadlineAt),
      `${job.location || "Location not listed"} · ${siteUrl()}/jobs/${job.id}`,
    ].join("\n");
  });
  return [
    `Hello ${person.name},`,
    "",
    openings.length === 1
      ? "This opening on Akazi matches what you studied or your CV:"
      : `These ${openings.length} openings on Akazi match what you studied or your CV:`,
    "",
    lines.join("\n\n"),
    "",
    "Apply on the employer’s site from the role page. Akazi only sends these notes because you agreed to email alerts.",
  ].join("\n");
}

async function recordAndSend(person: SubscriberRecord, openings: JobRecord[]): Promise<AlertResult> {
  if (openings.length === 0) return { matched: 0, sent: 0, queued: 0 };
  const now = new Date().toISOString();
  const ready = mailConfigured();
  let sent = 0;
  let queued = 0;

  if (ready) {
    try {
      await deliver(
        person.email,
        openings.length === 1 ? `A role on Akazi matches you: ${openings[0].title}` : `${openings.length} Akazi roles match you`,
        emailBody(person, openings),
      );
      sent = openings.length;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      for (const job of openings) {
        remember(person.id, job.id, "failed", detail.slice(0, 300), now);
      }
      return { matched: openings.length, sent: 0, queued: 0 };
    }
  } else {
    queued = openings.length;
  }

  for (const job of openings) {
    remember(person.id, job.id, ready ? "sent" : "queued", null, now);
  }
  return { matched: openings.length, sent, queued };
}

function unseenMatches(person: SubscriberRecord, candidates: JobRecord[]) {
  if (candidates.length === 0) return [];
  const already = new Set(
    db
      .select({ jobId: notifications.jobId })
      .from(notifications)
      .where(
        and(
          eq(notifications.subscriberId, person.id),
          ne(notifications.status, "failed"),
          inArray(
            notifications.jobId,
            candidates.map((job) => job.id),
          ),
        ),
      )
      .all()
      .map((row) => row.jobId),
  );
  return candidates.filter(
    (job) => !already.has(job.id) && matchesProfile(job, person.studies, person.cvText),
  );
}

export async function matchSubscriber(subscriberId: number): Promise<AlertResult> {
  const person = db.select().from(subscribers).where(eq(subscribers.id, subscriberId)).get();
  if (!person) return { matched: 0, sent: 0, queued: 0 };
  const active = db.select().from(jobs).where(eq(jobs.isActive, true)).all();
  return recordAndSend(person, unseenMatches(person, active));
}

export async function notifyNewJobs(jobIds: number[]) {
  await flushQueuedAlerts();
  if (jobIds.length === 0) return "";
  const openings = db.select().from(jobs).where(and(eq(jobs.isActive, true), inArray(jobs.id, jobIds))).all();
  const people = db.select().from(subscribers).all();
  if (people.length === 0 || openings.length === 0) return "";

  let sent = 0;
  let queued = 0;
  for (const person of people) {
    const result = await recordAndSend(person, unseenMatches(person, openings));
    sent += result.sent;
    queued += result.queued;
  }
  if (sent === 0 && queued === 0) return "";
  if (!mailConfigured()) return `Alerts: ${queued} match email${queued === 1 ? "" : "s"} queued until SMTP is configured`;
  return `Alerts: ${sent} match email${sent === 1 ? "" : "s"} sent`;
}

export async function flushQueuedAlerts() {
  if (!mailConfigured()) return;
  const queued = db.select().from(notifications).where(eq(notifications.status, "queued")).all();
  if (queued.length === 0) return;
  const byPerson = new Map<number, number[]>();
  for (const row of queued) {
    const list = byPerson.get(row.subscriberId) ?? [];
    list.push(row.jobId);
    byPerson.set(row.subscriberId, list);
  }
  for (const [subscriberId, jobIds] of byPerson) {
    const person = db.select().from(subscribers).where(eq(subscribers.id, subscriberId)).get();
    if (!person) continue;
    const openings = db.select().from(jobs).where(inArray(jobs.id, jobIds)).all();
    try {
      await deliver(
        person.email,
        openings.length === 1 ? `A role on Akazi matches you: ${openings[0]?.title ?? "New role"}` : `${openings.length} Akazi roles match you`,
        emailBody(person, openings),
      );
      db.update(notifications)
        .set({ status: "sent", detail: null })
        .where(and(eq(notifications.subscriberId, subscriberId), eq(notifications.status, "queued")))
        .run();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      db.update(notifications)
        .set({ status: "failed", detail: detail.slice(0, 300) })
        .where(and(eq(notifications.subscriberId, subscriberId), eq(notifications.status, "queued")))
        .run();
    }
  }
}
