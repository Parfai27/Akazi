import type { JobRecord } from "@/db/schema";
import { htmlToText } from "@/lib/html-text";
import { micro1ReferralApplyUrl } from "@/lib/micro1-referral";
import { functionLabel, jobFunction } from "@/lib/organize";
import { placeLabel, workModeLabel } from "@/lib/tag";
import { deadlineLabel, formatPosted, safeApplyUrl, safeHttpUrl } from "@/lib/url";

export function resolveApplyHref(job: Pick<JobRecord, "sourceId" | "externalId" | "applyUrl">): string | null {
  if (job.sourceId === "micro1") return micro1ReferralApplyUrl(job.externalId) ?? safeApplyUrl(job.applyUrl);
  return safeApplyUrl(job.applyUrl);
}

export function resolveSourceHref(job: Pick<JobRecord, "sourceId" | "sourceUrl" | "applyUrl" | "externalId">): string | null {
  if (job.sourceId === "micro1") return resolveApplyHref(job);
  return safeHttpUrl(job.sourceUrl);
}

/** A readable place, without a leading "Hybrid" or "Remote" that repeats the work mode. */
export function placePhrase(job: Pick<JobRecord, "location" | "place">) {
  let text = job.location.trim().replace(/^(remote|hybrid|on-?site)\b/i, "");
  text = text.replace(/^[\s,:()-]+/, "").replace(/[)\s]+$/, "").trim();
  if (!text || /^(remote|hybrid|on-?site)$/i.test(text)) return placeLabel(job.place);
  return text;
}

export function jobMetaDescription(job: JobRecord): string {
  const mode = workModeLabel(job.workMode).toLowerCase();
  const fn = functionLabel(jobFunction(job.title)).toLowerCase();
  const where = placePhrase(job);
  const deadline = formatPosted(job.deadlineAt);
  let text = `${job.title} at ${job.company}. ${sentenceCase(mode)} ${fn} role in ${where}.`;
  text += deadline ? ` Apply by ${deadline}.` : " See how to apply on Akazi.";
  const snippet = plainSnippet(job.description);
  if (snippet && text.length + snippet.length + 1 <= 170) text = `${text} ${snippet}`;
  return clip(text, 160);
}

export function jobGlance(job: JobRecord): string {
  const mode = workModeLabel(job.workMode).toLowerCase();
  const fn = functionLabel(jobFunction(job.title)).toLowerCase();
  const where = placePhrase(job);
  const posted = formatPosted(job.postedAt);
  const deadline = formatPosted(job.deadlineAt);
  return [
    `${job.title} is ${/^[aeiou]/.test(mode) ? "an" : "a"} ${mode} ${fn} opening at ${job.company}.`,
    job.location.trim()
      ? `The posting places it in ${where}.`
      : `The posting does not name a city, and Akazi files it under ${where}.`,
    posted ? `The post date on the listing is ${posted}.` : "The original post date was not included.",
    deadline ? `The deadline written on the listing is ${deadline}.` : "No deadline is filled in on the listing.",
    "The full advertisement, with duties and requirements, is on the employer's own posting.",
  ].join(" ");
}

export function applyTips(job: JobRecord, applyHref: string | null, sourceHref: string | null): string[] {
  const where = placePhrase(job);
  const deadline = formatPosted(job.deadlineAt);
  const tips: string[] = [];

  tips.push(
    sourceHref
      ? "Read the full advertisement first. It lists the duties, the requirements, and any documents you need to send."
      : "Ask the employer for the full job description if you cannot find one, so you know the requirements before applying.",
  );

  if (applyHref?.startsWith("mailto:")) {
    const address = applyHref.slice("mailto:".length).split("?")[0];
    tips.push(
      `Apply by email to ${address}. Put “${job.title}” in the subject line and attach your CV as a PDF, with a cover letter if the advertisement asks for one.`,
    );
  } else if (applyHref) {
    tips.push(
      `Select Apply to open ${job.company}’s application page, and complete every step there. Akazi does not receive or forward applications.`,
    );
  } else {
    tips.push("Follow the application instructions in the full advertisement. Akazi does not receive or forward applications.");
  }

  if (!deadline) {
    tips.push("No closing date is listed. Check the advertisement, and apply soon, since roles can close without notice.");
  } else if (deadlineLabel(job.deadlineAt).startsWith("Deadline passed")) {
    tips.push(`The listed closing date, ${deadline}, has passed. Check the employer’s posting to see whether the role is still open.`);
  } else {
    tips.push(`Apply before ${deadline}. Sending it a day or two early leaves time to fix a failed upload or email.`);
  }

  if (job.workMode === "remote") {
    tips.push(
      "This role is remote. Check that the employer hires people living in Rwanda, and mention your time zone (Kigali, UTC+2) in your application.",
    );
  } else if (job.workMode === "hybrid") {
    tips.push(`This role is hybrid, with some days in the office in ${where}. Apply only if you can travel there regularly.`);
  } else {
    tips.push(`This role is based in ${where}. Apply only if you can work there in person.`);
  }

  tips.push(
    "Match your CV to the requirements in the advertisement and put your most relevant experience first.",
  );
  tips.push(
    "Never pay to apply or share a password or mobile-money PIN. Genuine employers do not charge application fees.",
  );
  return tips;
}

function plainSnippet(description: string): string {
  const plain = htmlToText(description).replace(/\s+/g, " ").trim();
  if (plain.length < 40) return "";
  return clip(plain, 80);
}

function sentenceCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function clip(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 40 ? cut.slice(0, space) : cut).trim()}…`;
}
