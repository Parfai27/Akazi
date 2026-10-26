import { and, eq, inArray, ne } from "drizzle-orm";
import nodemailer from "nodemailer";
import { db } from "../db";
import { jobs, notifications, subscribers, type JobRecord, type SubscriberRecord } from "../db/schema";
import { matchesProfile } from "./match";
import { deadlineOpen } from "./organize";
import { rememberMail } from "./record-log";
import { deadlineLabel } from "./url";

export type AlertResult = {
  matched: number;
  sent: number;
  queued: number;
};

function hookReady() {
  return Boolean(process.env.MAIL_HOOK_URL && process.env.MAIL_HOOK_SECRET);
}

export function mailConfigured() {
  return hookReady() || Boolean(process.env.SMTP_HOST && process.env.MAIL_FROM);
}

function siteUrl() {
  return (process.env.SITE_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000").replace(/\/$/, "");
}

async function deliverViaHook(to: string, subject: string, text: string, html: string) {
  const response = await fetch(process.env.MAIL_HOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      secret: process.env.MAIL_HOOK_SECRET,
      to,
      subject,
      text,
      html,
    }),
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });
  const reply = await response.text();
  if (!response.ok || !reply.includes("ok")) {
    throw new Error(reply.replace(/\s+/g, " ").slice(0, 180) || "The alert email could not be sent.");
  }
}

async function deliverViaSmtp(to: string, subject: string, text: string, html: string) {
  const port = Number(process.env.SMTP_PORT || 587);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    requireTLS: port === 587,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS?.replaceAll(" ", "") }
      : undefined,
  });
  await transport.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    text,
    html,
  });
}

async function deliver(to: string, subject: string, text: string, html: string) {
  if (hookReady()) return deliverViaHook(to, subject, text, html);
  await deliverViaSmtp(to, subject, text, html);
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

async function rememberKept(
  person: Pick<SubscriberRecord, "email">,
  job: Pick<JobRecord, "sourceId" | "externalId" | "title" | "company">,
  status: string,
  detail: string | null,
  now: string,
) {
  await rememberMail({
    email: person.email,
    sourceId: job.sourceId,
    externalId: job.externalId,
    title: job.title,
    company: job.company,
    status,
    detail: detail ?? "",
    createdAt: now,
  });
}

function subjectLine(openings: JobRecord[]) {
  const opening = openings[0];
  if (openings.length === 1 && opening) return `${opening.title} at ${opening.company}`;
  return `${openings.length} roles that match your studies`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function alertIntro(count: number) {
  return count === 1
    ? "This opening on Akazi matches what you studied or your CV."
    : `These ${count} openings on Akazi match what you studied or your CV.`;
}

function alertMessage(person: Pick<SubscriberRecord, "name">, openings: JobRecord[]) {
  const home = siteUrl();
  const intro = alertIntro(openings.length);
  const stop = "You asked Akazi to send these notes. Reply to this email if you want them to stop.";
  const roles = openings.map((job) => {
    const where = [job.location || "Location not listed", job.workMode === "remote" ? "Remote" : job.workMode === "hybrid" ? "Hybrid" : ""]
      .filter(Boolean)
      .join(", ");
    return {
      line: `${job.title} at ${job.company}. ${where}. ${deadlineLabel(job.deadlineAt)}.`,
      href: `${home}/jobs/${job.publicId}`,
    };
  });
  const text = [
    `Hello ${person.name},`,
    "",
    intro,
    "",
    roles.map((role) => `${role.line}\n${role.href}`).join("\n\n"),
    "",
    stop,
    "",
    "Akazi",
    home,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#ffffff;color:#171a21;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:24px;">
    <p style="margin:0 0 16px;">Hello ${escapeHtml(person.name)},</p>
    <p style="margin:0 0 16px;">${escapeHtml(intro)}</p>
    ${roles
      .map(
        (role) =>
          `<p style="margin:0 0 16px;">${escapeHtml(role.line)}<br /><a href="${role.href}" style="color:#1e6b58;">${escapeHtml(role.href)}</a></p>`,
      )
      .join("")}
    <p style="margin:0 0 16px;">${escapeHtml(stop)}</p>
    <p style="margin:0;">Akazi<br /><a href="${home}" style="color:#1e6b58;">${escapeHtml(home)}</a></p>
  </body>
</html>`;

  return { text, html };
}

async function recordAndSend(person: SubscriberRecord, openings: JobRecord[]): Promise<AlertResult> {
  if (openings.length === 0) return { matched: 0, sent: 0, queued: 0 };
  const now = new Date().toISOString();
  const ready = mailConfigured();
  let sent = 0;
  let queued = 0;

  if (ready) {
    try {
      const message = alertMessage(person, openings);
      await deliver(
        person.email,
        subjectLine(openings),
        message.text,
        message.html,
      );
      sent = openings.length;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      for (const job of openings) {
        remember(person.id, job.id, "failed", detail.slice(0, 300), now);
        await rememberKept(person, job, "failed", detail.slice(0, 300), now);
      }
      return { matched: openings.length, sent: 0, queued: 0 };
    }
  } else {
    queued = openings.length;
  }

  for (const job of openings) {
    const status = ready ? "sent" : "queued";
    remember(person.id, job.id, status, null, now);
    await rememberKept(person, job, status, null, now);
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
  const active = db
    .select()
    .from(jobs)
    .where(eq(jobs.isActive, true))
    .all()
    .filter((job) => deadlineOpen(job.deadlineAt));
  return recordAndSend(person, unseenMatches(person, active));
}

export async function notifyNewJobs(jobIds: number[]) {
  await flushQueuedAlerts();
  if (jobIds.length === 0) return "";
  const openings = db
    .select()
    .from(jobs)
    .where(and(eq(jobs.isActive, true), inArray(jobs.id, jobIds)))
    .all()
    .filter((job) => deadlineOpen(job.deadlineAt));
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
    const openings = db
      .select()
      .from(jobs)
      .where(inArray(jobs.id, jobIds))
      .all()
      .filter((job) => job.isActive && deadlineOpen(job.deadlineAt));
    try {
      const message = alertMessage(person, openings);
      await deliver(
        person.email,
        subjectLine(openings),
        message.text,
        message.html,
      );
      db.update(notifications)
        .set({ status: "sent", detail: null })
        .where(and(eq(notifications.subscriberId, subscriberId), eq(notifications.status, "queued")))
        .run();
      for (const job of openings) await rememberKept(person, job, "sent", null, new Date().toISOString());
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      db.update(notifications)
        .set({ status: "failed", detail: detail.slice(0, 300) })
        .where(and(eq(notifications.subscriberId, subscriberId), eq(notifications.status, "queued")))
        .run();
      for (const job of openings) await rememberKept(person, job, "failed", detail.slice(0, 300), new Date().toISOString());
    }
  }
}
