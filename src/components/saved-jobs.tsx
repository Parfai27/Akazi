"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CloseIcon, StarIcon } from "@/components/icons";
import {
  clearRecent,
  rememberViewed,
  removeSaved,
  toggleSaved,
  useRecentJobs,
  useSavedJobs,
  type StoredJob,
} from "@/lib/saved-jobs";

export function SaveJobButton({ job, variant = "full" }: { job: StoredJob; variant?: "full" | "icon" }) {
  const saved = useSavedJobs().some((item) => item.id === job.id);
  const label = saved ? "Saved" : "Save";
  return (
    <button
      type="button"
      onClick={() => toggleSaved(job)}
      aria-pressed={saved}
      aria-label={variant === "icon" ? (saved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`) : undefined}
      className={
        variant === "icon"
          ? `inline-flex size-11 shrink-0 items-center justify-center rounded-full border ${
              saved ? "border-amber bg-amber text-clay" : "border-line text-muted hover:border-forest hover:text-forest"
            }`
          : `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold ${
              saved ? "border-clay/30 bg-amber text-clay-deep" : "border-line text-ink hover:border-forest hover:text-forest"
            }`
      }
    >
      <StarIcon filled={saved} className={variant === "icon" ? "size-5 shrink-0" : "size-4 shrink-0"} />
      {variant === "full" ? <span aria-live="polite">{label}</span> : null}
    </button>
  );
}

/** Records the open role in this device's recently viewed list. */
export function ViewedTracker({ job }: { job: StoredJob }) {
  useEffect(() => {
    rememberViewed(job);
  }, [job]);
  return null;
}

function JobRow({ job, onRemove, removeLabel }: { job: StoredJob; onRemove?: () => void; removeLabel?: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4">
      <div className="min-w-0 flex-1">
        <Link href={`/jobs/${job.id}`} className="font-bold break-words text-ink underline-offset-4 hover:text-forest hover:underline">
          {job.title}
        </Link>
        <p className="mt-1 text-sm font-semibold break-words text-forest">{job.company}</p>
        <p className="mt-1 text-xs text-muted">{[job.where, job.deadline].filter(Boolean).join(" · ")}</p>
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-wash hover:text-ink"
        >
          <CloseIcon className="size-4 shrink-0" />
        </button>
      ) : null}
    </li>
  );
}

export function SavedJobsList() {
  const saved = useSavedJobs();
  if (saved.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line bg-card px-5 py-8 text-muted">
        Nothing saved yet. Open a role and select Save to keep it here.
      </p>
    );
  }
  return (
    <ul className="grid gap-3">
      {saved.map((job) => (
        <JobRow key={job.id} job={job} onRemove={() => removeSaved(job.id)} removeLabel={`Remove ${job.title} from saved jobs`} />
      ))}
    </ul>
  );
}

export function RecentJobsList({ limit, compact = false }: { limit?: number; compact?: boolean }) {
  const recent = useRecentJobs();
  const shown = limit ? recent.slice(0, limit) : recent;
  if (shown.length === 0) {
    return compact ? null : (
      <p className="rounded-2xl border border-dashed border-line bg-card px-5 py-8 text-muted">
        Roles you open appear here, so you can find them again.
      </p>
    );
  }
  if (compact) {
    return (
      <section className="mt-8" aria-labelledby="recent-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="recent-title" className="text-lg font-extrabold tracking-tight">
            Recently viewed
          </h2>
          <Link href="/saved" className="text-sm font-semibold text-forest underline-offset-4 hover:underline">
            Saved and recent
          </Link>
        </div>
        <ul className="mt-3 flex gap-3 overflow-x-auto overscroll-x-contain pb-2">
          {shown.map((job) => (
            <li key={job.id} className="w-64 shrink-0">
              <Link
                href={`/jobs/${job.id}`}
                className="block h-full rounded-2xl border border-line bg-card p-4 hover:border-forest"
              >
                <span className="line-clamp-2 font-bold break-words text-ink">{job.title}</span>
                <span className="mt-1 block truncate text-sm font-semibold text-forest">{job.company}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }
  return (
    <>
      <ul className="grid gap-3">
        {shown.map((job) => (
          <JobRow key={job.id} job={job} />
        ))}
      </ul>
      <button
        type="button"
        onClick={clearRecent}
        className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-muted hover:bg-card hover:text-ink"
      >
        <CloseIcon className="size-4 shrink-0" />
        Clear recently viewed
      </button>
    </>
  );
}
