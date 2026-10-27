import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdSlot } from "@/components/ad-slot";
import { CompanyMark } from "@/components/company-mark";
import { JobDescription } from "@/components/job-description";
import { JobShare } from "@/components/job-share";
import { JobViewers } from "@/components/job-viewers";
import { ArrowLeftIcon, ExternalIcon, EyeIcon } from "@/components/icons";
import { adConfig } from "@/lib/ads";
import { getJob } from "@/lib/jobs";
import { deadlineKind, functionLabel, jobFunction } from "@/lib/organize";
import { placeLabel, workModeLabel } from "@/lib/tag";
import { micro1ReferralApplyUrl } from "@/lib/micro1-referral";
import { deadlineLabel, formatPosted, safeApplyUrl, safeHttpUrl } from "@/lib/url";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return { title: "Role not found" };
  return {
    title: `${job.title} at ${job.company}`,
    description: `${workModeLabel(job.workMode)} role at ${job.company}.`,
  };
}

export default function JobPage({ params }: { params: Promise<Params> }) {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-muted">Loading role…</p>}>
      <JobDetail params={params} />
    </Suspense>
  );
}

async function JobDetail({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();

  const posted = formatPosted(job.postedAt);
  const applyUrl =
    job.sourceId === "micro1"
      ? micro1ReferralApplyUrl(job.externalId) ?? safeApplyUrl(job.applyUrl)
      : safeApplyUrl(job.applyUrl);
  const sourceUrl = job.sourceId === "micro1" ? applyUrl : safeHttpUrl(job.sourceUrl);
  const soon = deadlineKind(job.deadlineAt) === "soon";
  const place = placeLabel(job.place);
  const mode = workModeLabel(job.workMode);
  const showPlace = place.toLowerCase() !== mode.toLowerCase();
  const showLocation = Boolean(job.location && !/^(remote|hybrid|on-?site)$/i.test(job.location.trim()));
  const ads = adConfig();

  return (
    <article>
      <div className="sticky top-[8rem] z-20 bg-card md:top-[4.5rem]">
        <div className="flex w-full items-center px-4 py-1 sm:px-8">
          <Link
            href="/"
            aria-label="Back to openings"
            className="inline-flex size-11 items-center justify-center rounded-full bg-forest text-card hover:bg-forest-deep"
          >
            <ArrowLeftIcon />
          </Link>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div className="flex min-w-0 items-start gap-4">
            <CompanyMark name={job.company} website={job.applyUrl} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{job.title}</h1>
              <p className="mt-1 text-sm font-semibold text-forest">{job.company}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="rounded-md bg-chip px-2.5 py-1 text-forest">{mode}</span>
            {showPlace ? <span className="rounded-md bg-chip px-2.5 py-1 text-forest">{place}</span> : null}
            <span className="rounded-md bg-amber px-2.5 py-1 text-clay">{functionLabel(jobFunction(job.title))}</span>
            <Suspense
              fallback={
                <span className="inline-flex items-center gap-1 rounded-md bg-chip px-2.5 py-1 font-semibold text-forest" aria-hidden="true">
                  <EyeIcon />
                </span>
              }
            >
              <JobViewers publicId={job.publicId} sourceId={job.sourceId} externalId={job.externalId} />
            </Suspense>
          </div>

          {!job.isActive ? (
            <p className="mt-6 rounded-xl border border-clay/30 bg-amber px-4 py-3 text-sm text-clay-deep">
              This role is no longer listed.
            </p>
          ) : null}

          {job.description ? (
            <div className="mt-10">
              <JobDescription text={job.description} />
            </div>
          ) : null}

          {ads?.slot ? <AdSlot client={ads.client} slot={ads.slot} /> : null}

          {sourceUrl ? (
            <p className="mt-10 border-t border-line pt-4 text-sm leading-6">
              <a className="font-medium text-forest underline-offset-4 hover:underline" href={sourceUrl} target="_blank" rel="noopener noreferrer">
                View the original posting
              </a>
            </p>
          ) : null}
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)] lg:sticky lg:top-[8.5rem]">
          <h2 className="text-lg font-extrabold">Job overview</h2>
          <dl className="mt-4 grid gap-4 text-sm">
            {posted ? (
              <div>
                <dt className="font-semibold">Date posted</dt>
                <dd className="mt-1 text-muted">{posted}</dd>
              </div>
            ) : null}
            <div>
              <dt className="font-semibold">Deadline</dt>
              <dd className={`mt-1 ${soon ? "font-semibold text-clay" : "text-muted"}`}>{deadlineLabel(job.deadlineAt)}</dd>
            </div>
            {showLocation ? (
              <div>
                <dt className="font-semibold">Location</dt>
                <dd className="mt-1 break-words text-muted">{job.location}</dd>
              </div>
            ) : null}
          </dl>
          {applyUrl ? (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-forest px-5 text-sm font-semibold text-card hover:bg-forest-deep"
            >
              Apply
              <ExternalIcon />
            </a>
          ) : null}
          <JobShare title={job.title} company={job.company} />
        </aside>
      </div>
    </article>
  );
}
