"use client";

import { useEffect, useState } from "react";

function label(iso: string, now: number) {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "";
  const minutes = Math.max(0, Math.round((now - then) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(then).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** A relative time that keeps itself current while the page stays open. */
export function TimeAgo({ iso, className }: { iso: string; className?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {label(iso, now)}
    </time>
  );
}

const NEW_WINDOW = 2 * 86_400_000;

/** A pulsing "New" tag for roles posted in the last two days, decided in the browser so cached pages stay honest. */
export function NewBadge({ iso }: { iso: string }) {
  const [fresh, setFresh] = useState(false);
  useEffect(() => {
    queueMicrotask(() => setFresh(Date.now() - Date.parse(iso) < NEW_WINDOW));
  }, [iso]);
  if (!fresh) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#fff4dc] px-2 py-0.5 text-[11px] font-bold text-clay-deep">
      <span className="akazi-pulse size-1.5 rounded-full bg-clay" aria-hidden="true" />
      New
    </span>
  );
}
