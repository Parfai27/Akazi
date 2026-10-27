import Link from "next/link";
import type { JobRecord } from "@/db/schema";
import { CompanyMark } from "@/components/company-mark";
import { deadlineKind, functionLabel, jobFunction } from "@/lib/organize";
import { workModeLabel } from "@/lib/tag";
import { jobPath } from "@/lib/job-key";
import { deadlineShort } from "@/lib/url";

export function JobCard({ job }: { job: JobRecord }) {
  const kind = deadlineKind(job.deadlineAt);
  const closes = deadlineShort(job.deadlineAt);

  return (
    <li className="h-full">
      <Link
        href={jobPath(job)}
        className="group flex h-full flex-col rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(30,107,88,0.12)]"
      >
        <div className="flex items-center gap-3">
          <CompanyMark name={job.company} website={job.applyUrl} />
          <p className="line-clamp-2 text-sm font-semibold text-forest">{job.company}</p>
        </div>
        <h2 className="mt-4 text-lg font-bold leading-snug tracking-tight text-ink group-hover:text-forest">
          {job.title}
        </h2>
        {job.location ? <p className="mt-2 line-clamp-2 text-sm text-muted">{job.location}</p> : null}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-xs font-medium">
          <span className="rounded-md bg-chip px-2.5 py-1 text-forest">{workModeLabel(job.workMode)}</span>
          <span className="rounded-md bg-amber px-2.5 py-1 text-clay">{functionLabel(jobFunction(job.title))}</span>
          {closes ? (
            <span className={kind === "soon" ? "text-clay" : "text-muted"}>{closes}</span>
          ) : null}
        </div>
      </Link>
    </li>
  );
}
