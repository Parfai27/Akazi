import type { JobRecord } from "@/db/schema";
import { searchOpenings, toChatJob, type ChatJob } from "@/lib/chat";
import { functionLabel, jobFunction } from "@/lib/organize";
import { CONTACT_EMAIL } from "@/lib/site";
import { placeLabel, workModeLabel } from "@/lib/tag";
import { formatPosted } from "@/lib/url";

export type ChatTurn = { from: "visitor" | "akazi"; text: string };

const DEFAULT_MODEL = "gemini-flash-latest";
const CANDIDATES = 25;
const TIMEOUT_MS = 15_000;

export function aiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/**
 * Answers with Gemini, grounded in the openings that best match the conversation.
 * Returns null when the model is not configured or fails, so the caller can fall back to the keyword answer.
 */
export async function answerWithAi(
  message: string,
  history: ChatTurn[],
  active: JobRecord[],
): Promise<{ reply: string; jobs: ChatJob[] } | null> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

  const recent = [...history.filter((turn) => turn.from === "visitor").slice(-2).map((turn) => turn.text), message].join(" ");
  const candidates = pickCandidates(message, recent, active);
  const byId = new Map(candidates.map((job) => [toChatJob(job).id, job]));

  // Gemini expects the conversation to open with the visitor, so the greeting bubble is left out.
  const turns = history.slice(-8);
  while (turns[0]?.from === "akazi") turns.shift();
  const contents = [
    ...turns.map((turn) => ({
      role: turn.from === "visitor" ? "user" : "model",
      parts: [{ text: turn.text }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instructions(active, candidates) }] },
        contents,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              reply: { type: "STRING" },
              job_ids: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["reply", "job_ids"],
          },
        },
      }),
    });
    if (!response.ok) {
      console.error(`Chat AI request failed: ${response.status}`);
      return null;
    }
    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const raw = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    const parsed = JSON.parse(raw) as { reply?: unknown; job_ids?: unknown };
    const reply = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
    if (!reply) return null;
    const ids = Array.isArray(parsed.job_ids) ? parsed.job_ids.filter((id): id is string => typeof id === "string") : [];
    // Only openings that were offered to the model can be shown, so it cannot invent a listing.
    const jobs = [...new Set(ids)]
      .map((id) => byId.get(id))
      .filter((job): job is JobRecord => Boolean(job))
      .slice(0, 4)
      .map(toChatJob);
    return { reply, jobs };
  } catch (error) {
    console.error("Chat AI request failed", error instanceof Error ? error.message : error);
    return null;
  }
}

function pickCandidates(message: string, recent: string, active: JobRecord[]) {
  const fromMessage = searchOpenings(message, active);
  const pool = fromMessage.length > 0 && fromMessage.length < active.length ? fromMessage : searchOpenings(recent, active);
  const terms = recent.toLowerCase().match(/[a-z][a-z0-9+]{2,}/g) ?? [];
  const score = (job: JobRecord) => {
    const title = job.title.toLowerCase();
    const company = job.company.toLowerCase();
    return terms.reduce((sum, term) => sum + (title.includes(term) ? 3 : 0) + (company.includes(term) ? 2 : 0), 0);
  };
  return [...(pool.length > 0 ? pool : active)]
    .sort((a, b) => score(b) - score(a) || (b.postedAt ?? "").localeCompare(a.postedAt ?? ""))
    .slice(0, CANDIDATES);
}

function instructions(active: JobRecord[], candidates: JobRecord[]) {
  const count = (test: (job: JobRecord) => boolean) => active.filter(test).length;
  const listing = candidates
    .map((job) => {
      const card = toChatJob(job);
      const posted = formatPosted(job.postedAt);
      return [
        `id=${card.id}`,
        job.title,
        job.company,
        `${workModeLabel(job.workMode)} · ${placeLabel(job.place)}${job.location ? ` (${job.location})` : ""}`,
        functionLabel(jobFunction(job.title)),
        card.deadline,
        posted ? `posted ${posted}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
    })
    .join("\n");

  return `You are Ask Akazi, the assistant on akazi.co.rw, a free job board for people looking for work in Rwanda.

How to answer:
- Be warm, natural, and brief: two to four short sentences. Reply in the visitor's language (English, Kinyarwanda, or French).
- Small talk is fine. Answer it like a person, then offer to help find a job.
- You can give practical career help: CVs, cover letters, interviews, internships, and working remotely from Rwanda.
- When the visitor wants roles, recommend up to 4 from the OPENINGS list below and put their ids in job_ids. The cards with title, company, and deadline are shown under your reply, so do not repeat ids or long details in the text.
- Only recommend openings from the list. Never invent a job, company, salary, or deadline. If nothing in the list fits, say so and suggest another search or email alerts.
- If a request is vague, ask one short question (field, place, or remote) instead of listing roles.
- Leave job_ids empty when you are not recommending roles.
- Applications go to the employer: the visitor opens a role on Akazi and uses Apply. Akazi does not receive applications.
- Email alerts: open Alerts, add name, email, what you studied, and optionally a CV; Akazi emails new matching roles.
- Never ask for passwords, ID numbers, or payment. Real employers do not charge to apply. Contact: ${CONTACT_EMAIL}.
- For anything unrelated to work or careers, say briefly that you only help with jobs and careers.

Board today: ${active.length} open roles. Kigali: ${count((job) => job.place === "kigali")}. Elsewhere in Rwanda: ${count((job) => job.place === "rwanda")}. Remote: ${count((job) => job.workMode === "remote")}.

OPENINGS (best matches for this conversation):
${listing || "(none)"}`;
}
