import type { ReactNode } from "react";
import { ExternalIcon, PinIcon } from "@/components/icons";

/** How much of a 30-day window is left before the deadline, as a bar and plain words. */
export function DeadlineMeter({ days, label }: { days: number | null; label: string }) {
  if (days === null) {
    return <p className="mt-3 text-sm text-muted">No closing date listed. Apply soon, since roles can close without notice.</p>;
  }
  const soon = days <= 7;
  const words = days === 0 ? "Closes today" : days === 1 ? "Closes tomorrow" : `Closes in ${days} days`;
  const width = Math.max(4, Math.min(100, (days / 30) * 100));
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
      <div
        className="h-2 w-32 overflow-hidden rounded-full bg-wash"
        role="meter"
        aria-label="Time left to apply"
        aria-valuemin={0}
        aria-valuemax={30}
        aria-valuenow={Math.min(days, 30)}
        aria-valuetext={words}
      >
        <div className={`h-full rounded-full ${soon ? "bg-clay" : "bg-forest"}`} style={{ width: `${width}%` }} />
      </div>
      <p className={`text-sm font-semibold ${soon ? "text-clay-deep" : "text-ink"}`}>
        {words} <span className="font-normal text-muted">({label})</span>
      </p>
    </div>
  );
}

export function FactChip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-wash px-3 py-1.5 text-sm font-medium text-ink">
      <span className="text-forest">{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </li>
  );
}

/** A map of the listed place, with a link that opens directions in Google Maps. */
export function JobMap({ company, location }: { company: string; location: string }) {
  const query = `${company}, ${location}`;
  const embed = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
  return (
    <section aria-labelledby="map-title" className="mt-6 overflow-hidden rounded-2xl border border-line bg-card print:hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <h2 id="map-title" className="text-lg font-extrabold">
            Where you would work
          </h2>
          <p className="mt-1 flex items-start gap-1.5 text-sm break-words text-muted">
            <PinIcon className="mt-0.5 size-4 shrink-0 text-forest" />
            {location}
          </p>
        </div>
        <a
          href={directions}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold text-forest hover:border-forest"
        >
          Get directions
          <ExternalIcon />
          <span className="sr-only">(opens Google Maps in a new tab)</span>
        </a>
      </div>
      <iframe
        title={`Map of ${location}`}
        src={embed}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block h-64 w-full border-0 bg-wash"
      />
      <p className="px-5 py-3 text-xs leading-5 text-muted">
        The pin is Google&apos;s best guess from the listed place, so confirm the exact address with the employer.
      </p>
    </section>
  );
}
