import type { JobRecord } from "@/db/schema";
import { deadlineLabel, formatPosted } from "@/lib/url";
import { placeLabel, workModeLabel } from "@/lib/tag";

export type ChatJob = {
  id: number;
  title: string;
  company: string;
  deadline: string;
  meta: string;
};

const IGNORE = new Set([
  "about",
  "akazi",
  "any",
  "deadline",
  "deadlines",
  "find",
  "have",
  "jobs",
  "job",
  "list",
  "looking",
  "open",
  "opening",
  "openings",
  "please",
  "role",
  "roles",
  "show",
  "there",
  "what",
  "when",
  "where",
  "which",
  "with",
]);

function words(text: string) {
  return [...new Set(text.toLowerCase().match(/[a-z][a-z0-9+]{2,}/g) ?? [])];
}

function toChatJob(job: JobRecord): ChatJob {
  const posted = formatPosted(job.postedAt);
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    deadline: deadlineLabel(job.deadlineAt),
    meta: [workModeLabel(job.workMode), placeLabel(job.place), job.location, posted ? `Posted ${posted}` : ""]
      .filter(Boolean)
      .join(" · "),
  };
}

export function answerQuestion(message: string, openings: JobRecord[]) {
  const text = message.trim().toLowerCase();
  const active = openings.filter((job) => job.isActive);
  if (!text) {
    return { reply: "Ask me about open roles, a deadline, or how email alerts work.", jobs: [] as ChatJob[] };
  }
  if (/^(hi|hello|hey|good morning|good afternoon)\b/.test(text)) {
    return {
      reply: `Hello. There are ${active.length} open roles on Akazi. Ask for Kigali, remote work, a skill, or a company.`,
      jobs: [] as ChatJob[],
    };
  }
  if (/alert|notif|email me|my cv|what i studied|studied/.test(text)) {
    return {
      reply:
        "Open Alerts and leave your name, email, what you studied, and your CV. Tick the box to agree to email. When a role matches your studies or CV, Akazi emails you.",
      jobs: [] as ChatJob[],
    };
  }
  if (/how (do i |to )?apply|application/.test(text) && !/accountant|engineer|manager/.test(text)) {
    return {
      reply: "Open a role and use Apply.",
      jobs: [] as ChatJob[],
    };
  }

  let pool = active;
  if (/\bkigali\b/.test(text)) {
    pool = pool.filter((job) => job.place === "kigali" || /\bkigali\b/i.test(job.location));
  } else if (/\brwanda\b/.test(text) && !/\bremote\b/.test(text)) {
    pool = pool.filter((job) => job.place === "kigali" || job.place === "rwanda");
  }
  if (/\bremote\b/.test(text)) pool = pool.filter((job) => job.workMode === "remote");
  if (/\bhybrid\b/.test(text)) pool = pool.filter((job) => job.workMode === "hybrid");
  if (/\bon-?site\b/.test(text)) pool = pool.filter((job) => job.workMode === "onsite");

  const companies = [...new Set(active.map((job) => job.company))];
  const company = companies.find((name) => text.includes(name.toLowerCase()));
  if (company) pool = pool.filter((job) => job.company === company);

  const terms = words(text).filter((word) => !IGNORE.has(word) && !["kigali", "rwanda", "remote", "hybrid", "onsite", "site"].includes(word));
  if (company) {
    const leftover = terms.filter((word) => !company.toLowerCase().includes(word));
    if (leftover.length > 0) {
      pool = pool.filter((job) =>
        leftover.some((word) => `${job.title} ${job.description}`.toLowerCase().includes(word)),
      );
    }
  } else if (terms.length > 0) {
    pool = pool.filter((job) =>
      terms.some((word) => `${job.title} ${job.company} ${job.description}`.toLowerCase().includes(word)),
    );
  }

  const top = pool.slice(0, 4).map(toChatJob);
  if (top.length === 0) {
    return {
      reply: "I could not find an open role for that. Try a skill, a company name, Kigali, or remote.",
      jobs: [] as ChatJob[],
    };
  }
  const askingDeadline = /deadline|closing|due/.test(text);
  const reply = askingDeadline
    ? `Here ${top.length === 1 ? "is the deadline" : "are deadlines"} for ${pool.length} matching role${pool.length === 1 ? "" : "s"}.`
    : `I found ${pool.length} matching role${pool.length === 1 ? "" : "s"}.`;
  return { reply, jobs: top };
}
