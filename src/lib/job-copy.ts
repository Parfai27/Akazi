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
    `${job.title} is a ${mode} ${fn} opening at ${job.company}.`,
    job.location.trim()
      ? `The posting places it in ${where}.`
      : `The posting does not name a city, and Akazi files it under ${where}.`,
    posted ? `The post date on the listing is ${posted}.` : "The original post date was not included.",
    deadline ? `The deadline written on the listing is ${deadline}.` : "No deadline is filled in on the listing.",
    "The notes below are written by Akazi. The advertisement under them is the employer's own text.",
  ].join(" ");
}

export function applyTips(job: JobRecord, applyHref: string | null): string[] {
  const mode = workModeLabel(job.workMode).toLowerCase();
  const fn = functionLabel(jobFunction(job.title)).toLowerCase();
  const where = job.location.trim();
  const tips = [
    `${job.title} is listed here so you can find it. ${job.company} takes the application. Akazi does not.`,
  ];
  if (applyHref?.startsWith("mailto:")) {
    tips.push(
      `Email ${applyHref.slice("mailto:".length)} with the job title in the subject and a PDF CV attached.`,
    );
  } else if (applyHref) {
    tips.push(
      `Use Apply. It opens the employer's own site. Finish every step there, including an account if they ask for one.`,
    );
  } else {
    tips.push("This listing has no apply link. Open the original posting and follow the instructions written there.");
  }
  if (formatPosted(job.deadlineAt)) {
    tips.push(
      `${deadlineLabel(job.deadlineAt)}. Many employers in Rwanda close a role on that day, so do not leave it to the last hour.`,
    );
  } else {
    tips.push(
      "No deadline is stored in the listing fields. Read the advert in case the date is only written in the text, and apply while it is still open.",
    );
  }
  if (job.workMode === "remote") {
    tips.push(
      where
        ? `It is remote (${where}). Say that you are based in Rwanda, which hours you can overlap with the team, and which languages you work in.`
        : "It is remote. Say that you are based in Rwanda, which hours you can overlap with the team, and which languages you work in.",
    );
  } else {
    tips.push(
      where
        ? `This is ${mode} work in ${where}. Be clear that you can be there on the days they expect.`
        : `This is ${mode} work. Be clear about the place you can be based.`,
    );
  }
  tips.push(
    `Shape your CV around this ${fn} role and put the experience they ask for near the top. Name Kinyarwanda, English, or French only at the level you can actually work in.`,
  );
  tips.push(
    `Do not pay a fee, buy a starter kit, or share a mobile-money PIN. A real application to ${job.company} will not ask you to pay in order to be hired.`,
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
