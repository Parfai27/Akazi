import Link from "next/link";
import type { JobRecord } from "@/db/schema";
import { CompanyMark } from "@/components/company-mark";
import { functionLabel, jobFunction } from "@/lib/organize";
import { workModeLabel } from "@/lib/tag";
import { jobKey, jobPath } from "@/lib/job-key";
import { NewBadge, TimeAgo } from "@/components/time-ago";
import { SaveJobButton } from "@/components/saved-jobs";
import type { StoredJob } from "@/lib/saved-jobs";

export function JobCard({
  job,
  closes,
  soon,
  heading: Heading = "h3",
}: {
  job: JobRecord;
  closes: string | null;
  soon: boolean;
  heading?: "h2" | "h3";
}) {
  const posted = job.postedAt && !Number.isNaN(Date.parse(job.postedAt)) ? job.postedAt : null;
  const stored: StoredJob = {
    id: job.publicId || jobKey(job.sourceId, job.externalId),
    title: job.title,
    company: job.company,
    where: job.location,
    deadline: closes ?? "",
  };
  return (
    // The save button sits beside the link, not inside it, so it stays a separate control for keyboards and readers.
    <li className="akazi-lift akazi-reveal relative h-full">
      <Link
        href={jobPath(job)}
        className="group flex h-full flex-col rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)] hover:shadow-[0_12px_28px_rgba(30,107,88,0.12)]"
      >
        <div className="flex items-center gap-3 pr-12">
          <CompanyMark name={job.company} website={job.applyUrl} />
          <p className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold break-words text-forest">{job.company}</p>
          {posted ? <NewBadge iso={posted} /> : null}
        </div>
        <Heading className="mt-4 text-lg font-bold leading-snug tracking-tight break-words text-ink group-hover:text-forest">
          {job.title}
        </Heading>
        {job.location ? <p className="mt-2 line-clamp-2 text-sm text-muted">{job.location}</p> : null}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-xs font-medium">
          <span className="rounded-md bg-chip px-2.5 py-1 text-forest">{workModeLabel(job.workMode)}</span>
          <span className="rounded-md bg-amber px-2.5 py-1 text-clay">{functionLabel(jobFunction(job.title))}</span>
          {closes ? (
            <span className={soon ? "text-clay" : "text-muted"}>{closes}</span>
          ) : null}
          {posted ? (
            <span className="ml-auto text-muted">
              Posted <TimeAgo iso={posted} />
            </span>
          ) : null}
        </div>
      </Link>
      <div className="absolute top-5 right-4">
        <SaveJobButton job={stored} variant="icon" />
      </div>
    </li>
  );
}
