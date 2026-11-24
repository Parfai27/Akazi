import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CompanyMark } from "@/components/company-mark";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  BellIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  ExternalIcon,
  EyeIcon,
  LevelIcon,
  PinIcon,
} from "@/components/icons";
import { JobAssistant } from "@/components/job-assistant";
import { JobActions } from "@/components/job-extras";
import { DeadlineMeter, FactChip, JobMap } from "@/components/job-facts";
import { JobShare } from "@/components/job-share";
import { JobViewers } from "@/components/job-viewers";
import { SaveJobButton, ViewedTracker } from "@/components/saved-jobs";
import { boardPath, EMPTY_JOB_ID, firstPageFilters, getJobPage, listSitemapJobs, type RelatedCard } from "@/lib/jobs";
import { functionLabel, jobFunction, jobLevel, levelLabel, shelfOf } from "@/lib/organize";
import type { StoredJob } from "@/lib/saved-jobs";
import { placeLabel, workModeLabel } from "@/lib/tag";

type Params = { id: string };

export async function generateStaticParams() {
  const listed = await listSitemapJobs();
  if (listed.length === 0) return [{ id: EMPTY_JOB_ID }];
  return listed.map((job) => ({ id: job.publicId }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getJobPage(id);
  if (!data) return { title: "Role not found", robots: { index: false, follow: false } };
  const title = `${data.job.title} at ${data.job.company}`;
  return {
    title,
    description: data.metaDescription,
    alternates: { canonical: `/jobs/${id}` },
    // Listings summarise other employers' adverts, so search engines index the board and guides instead.
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description: data.metaDescription,
      url: `/jobs/${id}`,
      siteName: "Akazi",
      type: "article",
    },
  };
}

export default async function JobPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const data = await getJobPage(id);
  if (!data) {
    if (id === EMPTY_JOB_ID) return <EmptyBoard />;
    notFound();
  }

  const { job } = data;
  const place = placeLabel(job.place);
  const mode = workModeLabel(job.workMode);
  const fn = jobFunction(job.title);
  const showLocation = Boolean(job.location && !/^(remote|hybrid|on-?site)$/i.test(job.location.trim()));
  const where = showLocation ? job.location : place;
  const remoteGuide = job.workMode === "remote";
  const stored: StoredJob = { id: job.publicId, title: job.title, company: job.company, where, deadline: data.deadline };
  const moreLikeThis = boardPath({ ...firstPageFilters(), fn, shelf: shelfOf(job) });

  return (
    <article>
      <ViewedTracker job={stored} />
      <div className="sticky top-[4.5rem] z-20 bg-card print:hidden">
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

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <header className="rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)] sm:p-6">
            <div className="flex min-w-0 items-start gap-4">
              <CompanyMark name={job.company} website={job.applyUrl} size="lg" />
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-extrabold tracking-tight break-words text-ink sm:text-3xl">{job.title}</h1>
                <p className="mt-1 text-sm font-semibold break-words">
                  <Link href={`/companies/${data.companySlug}`} className="text-forest underline-offset-4 hover:underline">
                    {job.company}
                  </Link>
                </p>
              </div>
              <div className="print:hidden">
                <SaveJobButton job={stored} variant="icon" />
              </div>
            </div>
            <DeadlineMeter days={data.daysLeft} label={data.deadline} />

            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Job facts">
              <FactChip icon={<PinIcon />}>{where}</FactChip>
              <FactChip icon={<BuildingIcon />}>{mode}</FactChip>
              <FactChip icon={<LevelIcon />}>{levelLabel(jobLevel(job.title))}</FactChip>
              <FactChip icon={<BriefcaseIcon />}>{functionLabel(fn)}</FactChip>
              {data.posted ? <FactChip icon={<CalendarIcon />}>Posted {data.posted}</FactChip> : null}
              <Suspense
                fallback={
                  <li className="inline-flex items-center gap-1 rounded-full bg-chip px-3 py-1.5 text-sm font-semibold text-forest" aria-hidden="true">
                    <EyeIcon />
                  </li>
                }
              >
                <li className="inline-flex items-center">
                  <JobViewers publicId={job.publicId} sourceId={job.sourceId} externalId={job.externalId} />
                </li>
              </Suspense>
            </ul>
            <p className="mt-3 text-xs leading-5 text-muted">Level and job type are Akazi&apos;s guess from the title.</p>
          </header>

          {!job.isActive ? (
            <p className="mt-6 flex items-center gap-2 rounded-xl border border-clay/30 bg-amber px-4 py-3 text-sm text-clay-deep">
              <AlertCircleIcon />
              This role is no longer listed, so the employer may have closed applications.
            </p>
          ) : null}

          <div className="print:hidden">
            <JobAssistant id={job.publicId} />
          </div>

          <section className="mt-6 rounded-2xl border border-line bg-card p-5">
            <h2 className="text-lg font-extrabold">At a glance</h2>
            <p className="mt-3 text-base leading-7 text-muted">{data.glance}</p>
          </section>

          <section className="mt-6 rounded-2xl border border-line bg-card p-5">
            <h2 className="text-lg font-extrabold">How to apply</h2>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-base leading-7 text-muted">
              {data.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ol>
            <p className="mt-4 text-sm leading-6 print:hidden">
              <Link className="font-medium text-forest underline-offset-4 hover:underline" href="/guides/writing-a-cv-for-rwanda">
                Writing a CV for Rwanda
              </Link>
              {" · "}
              <Link className="font-medium text-forest underline-offset-4 hover:underline" href="/guides/preparing-for-interviews">
                Preparing for interviews
              </Link>
              {remoteGuide ? (
                <>
                  {" · "}
                  <Link className="font-medium text-forest underline-offset-4 hover:underline" href="/guides/remote-work-from-rwanda">
                    Remote work from Rwanda
                  </Link>
                </>
              ) : null}
            </p>
          </section>

          <section className="mt-6 rounded-2xl border border-line bg-card p-5">
            <h2 className="text-lg font-extrabold">Full advertisement</h2>
            <p className="mt-3 text-base leading-7 text-muted">
              {job.company} publishes the duties, requirements, and how to apply on its own posting. Read it there before
              you apply, since the employer may update it.
            </p>
            {data.sourceHref ? (
              <a
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-4 text-sm font-semibold text-forest hover:border-forest print:hidden"
                href={data.sourceHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read the full advertisement
                <ExternalIcon />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : null}
          </section>

          {job.workMode !== "remote" && showLocation ? <JobMap company={job.company} location={job.location} /> : null}
        </div>

        <aside className="grid h-fit min-w-0 grid-cols-1 gap-6">
          <div className="rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)]">
            {data.applyHref ? (
              <a
                href={data.applyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-forest px-5 text-base font-semibold text-card hover:bg-forest-deep print:hidden"
              >
                Apply
                <ExternalIcon />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : (
              <p className="text-sm leading-6 text-muted">Follow the instructions in the full advertisement to apply.</p>
            )}
            <JobActions job={stored} />
            <div className="print:hidden">
              <JobShare title={job.title} company={job.company} />
            </div>
          </div>

          {data.related.length > 0 ? (
            <section aria-labelledby="similar-title" className="rounded-2xl border border-line bg-card p-5 print:hidden">
              <h2 id="similar-title" className="text-lg font-extrabold">
                Similar openings
              </h2>
              <ul className="mt-4 grid grid-cols-1 gap-3">
                {data.related.map((card) => (
                  <SimilarJob key={card.job.id} card={card} />
                ))}
              </ul>
              <Link
                href={moreLikeThis}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-wash px-4 text-sm font-semibold text-forest hover:bg-chip"
              >
                See more like this
              </Link>
            </section>
          ) : null}

          <Link
            href={`/alerts?studies=${encodeURIComponent(functionLabel(fn) === "Other" ? job.title : functionLabel(fn))}`}
            className="flex items-start gap-3 rounded-2xl border border-line bg-card p-5 hover:border-forest print:hidden"
          >
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-chip text-forest">
              <BellIcon />
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-ink">Email me jobs like this</span>
              <span className="mt-1 block text-sm leading-6 text-muted">Get new {functionLabel(fn).toLowerCase()} roles by email.</span>
            </span>
          </Link>
        </aside>
      </div>
    </article>
  );
}

function SimilarJob({ card }: { card: RelatedCard }) {
  const { job } = card;
  const where = job.workMode === "remote" ? "Remote" : job.location.split(",")[0] || placeLabel(job.place);
  return (
    <li className="relative flex items-start gap-3 rounded-xl bg-wash p-3 hover:bg-chip">
      <CompanyMark name={job.company} website={job.applyUrl} />
      <div className="min-w-0 flex-1">
        <Link href={`/jobs/${job.publicId}`} className="line-clamp-2 font-bold break-words text-ink after:absolute after:inset-0 hover:text-forest">
          {job.title}
        </Link>
        <p className="mt-0.5 truncate text-xs font-semibold text-forest">{job.company}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
          <PinIcon className="size-3 shrink-0" />
          {where}
        </p>
        {card.soon || card.fresh ? (
          <p className="mt-1.5 flex flex-wrap gap-1">
            {card.soon ? (
              <span className="rounded-md bg-amber px-2 py-0.5 text-[11px] font-bold text-clay-deep">Closing soon</span>
            ) : null}
            {card.fresh ? <span className="rounded-md bg-card px-2 py-0.5 text-[11px] font-bold text-forest">New</span> : null}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function EmptyBoard() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight">No openings yet</h1>
      <p className="mt-3 text-base leading-7 text-muted">Akazi has not listed any roles.</p>
      <Link href="/" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-forest hover:underline">
        <ArrowLeftIcon />
        Home
      </Link>
    </main>
  );
}
