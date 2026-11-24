"use client";

import { useId, useState, type FormEvent } from "react";
import { AlertCircleIcon, CheckIcon, SparkIcon } from "@/components/icons";

type Summary = { summary: string; duties: string[]; requirements: string[] };
type Fit = { verdict: "strong" | "partial" | "weak" | "unclear"; reasons: string[]; tips: string[] };

const VERDICT: Record<Fit["verdict"], { label: string; tone: string }> = {
  strong: { label: "Looks like a strong match", tone: "bg-chip text-forest" },
  partial: { label: "A partial match", tone: "bg-amber text-clay-deep" },
  weak: { label: "Probably not a match yet", tone: "bg-wash text-ink" },
  unclear: { label: "Hard to tell from this advert", tone: "bg-wash text-ink" },
};

async function ask<T>(body: Record<string, string>): Promise<T> {
  const response = await fetch("/api/job-assistant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok || data.error) throw new Error(data.error || "Something went wrong. Try again.");
  return data;
}

function Points({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-sm font-bold text-ink">{title}</h4>
      <ul className="mt-2 grid gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm leading-6 text-muted">
            <CheckIcon className="mt-1 size-4 shrink-0 text-forest" />
            <span className="min-w-0 break-words">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function JobAssistant({ id }: { id: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [fit, setFit] = useState<Fit | null>(null);
  const [about, setAbout] = useState("");
  const [busy, setBusy] = useState<"summary" | "fit" | null>(null);
  const [error, setError] = useState("");
  const [fitOpen, setFitOpen] = useState(false);
  const aboutId = useId();

  async function loadSummary() {
    setBusy("summary");
    setError("");
    try {
      setSummary(await ask<Summary>({ id, mode: "summary" }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function checkFit(event: FormEvent) {
    event.preventDefault();
    setBusy("fit");
    setError("");
    try {
      setFit(await ask<Fit>({ id, mode: "fit", about }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      aria-labelledby="assistant-title"
      className="mt-6 rounded-2xl border border-forest/20 bg-gradient-to-br from-chip/60 to-card p-5"
    >
      <p className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-forest uppercase">
        <SparkIcon className="size-3.5 shrink-0" />
        Akazi assistant
      </p>
      <h2 id="assistant-title" className="mt-1 text-lg font-extrabold">
        Understand this role faster
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        An AI reads the employer&apos;s advert for you. It can make mistakes, so check the full advertisement before you
        apply.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {summary ? null : (
          <button
            type="button"
            onClick={loadSummary}
            disabled={busy !== null}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-forest px-4 text-sm font-semibold text-card hover:bg-forest-deep disabled:opacity-60"
          >
            <SparkIcon />
            {busy === "summary" ? "Summarising…" : "Summarise this job"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setFitOpen((open) => !open)}
          aria-expanded={fitOpen}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-forest/30 bg-card px-4 text-sm font-semibold text-forest hover:border-forest"
        >
          Does this job fit me?
        </button>
      </div>

      <div aria-live="polite">
        {error ? (
          <p className="mt-4 flex items-start gap-2 text-sm text-clay-deep">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}

        {summary ? (
          <div className="mt-5 grid gap-4 rounded-xl bg-card p-4">
            <h3 className="sr-only">Summary</h3>
            <p className="text-base leading-7 text-ink">{summary.summary}</p>
            <Points title="Main work" items={summary.duties} />
            <Points title="What they ask for" items={summary.requirements} />
          </div>
        ) : null}
      </div>

      {fitOpen ? (
        <form onSubmit={checkFit} className="mt-5 grid gap-3 rounded-xl bg-card p-4">
          <label htmlFor={aboutId} className="text-sm font-semibold text-ink">
            Your studies and experience
          </label>
          <textarea
            id={aboutId}
            name="about"
            rows={4}
            value={about}
            onChange={(event) => setAbout(event.target.value)}
            maxLength={2000}
            placeholder="e.g. BSc in Accounting, 2 years as an accounts assistant, QuickBooks, English and French…"
            className="w-full rounded-xl border border-line bg-card px-3 py-2 text-base leading-6 outline-none focus-visible:border-forest focus-visible:ring-3 focus-visible:ring-forest/25"
          />
          <p className="text-xs leading-5 text-muted">
            Sent to the AI service for this check only and not saved by Akazi. Leave out your name, ID, and contact details.
          </p>
          <button
            type="submit"
            disabled={busy !== null || about.trim().length < 20}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-forest px-4 text-sm font-semibold text-card hover:bg-forest-deep disabled:opacity-60"
          >
            <SparkIcon />
            {busy === "fit" ? "Checking…" : "Check my fit"}
          </button>
          <div aria-live="polite">
            {fit ? (
              <div className="mt-2 grid gap-4">
                <p className={`w-fit rounded-full px-3 py-1 text-sm font-bold ${VERDICT[fit.verdict].tone}`}>
                  {VERDICT[fit.verdict].label}
                </p>
                <Points title="Why" items={fit.reasons} />
                <Points title="Tips for your application" items={fit.tips} />
              </div>
            ) : null}
          </div>
        </form>
      ) : null}
    </section>
  );
}
