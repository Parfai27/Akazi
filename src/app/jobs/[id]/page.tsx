import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdSlot } from "@/components/ad-slot";
import { CompanyMark } from "@/components/company-mark";
import { JobCard } from "@/components/job-card";
import { JobDescription } from "@/components/job-description";
import { JobShare } from "@/components/job-share";
import { JobViewers } from "@/components/job-viewers";
import { ArrowLeftIcon, ExternalIcon, EyeIcon } from "@/components/icons";
import { adConfig } from "@/lib/ads";
import { EMPTY_JOB_ID, getJobPage, listSitemapJobs } from "@/lib/jobs";
import { functionLabel, jobFunction } from "@/lib/organize";
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
  const showPlace = place.toLowerCase() !== mode.toLowerCase();
  const showLocation = Boolean(job.location && !/^(remote|hybrid|on-?site)$/i.test(job.location.trim()));
  const ads = adConfig();
  const remoteGuide = job.workMode === "remote";

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

          <section className="mt-8 rounded-2xl border border-line bg-card p-5">
            <h2 className="text-lg font-extrabold">At a glance</h2>
            <p className="mt-3 text-base leading-7 text-muted">{data.glance}</p>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold">Company</dt>
                <dd className="mt-1 text-muted">{job.company}</dd>
              </div>
              <div>
                <dt className="font-semibold">Job type</dt>
                <dd className="mt-1 text-muted">
                  {functionLabel(jobFunction(job.title))} · {mode}
                </dd>
              </div>
              <div>
                <dt className="font-semibold">Location</dt>
                <dd className="mt-1 break-words text-muted">{showLocation ? job.location : place}</dd>
              </div>
              <div>
                <dt className="font-semibold">Deadline</dt>
                <dd className={`mt-1 ${data.soon ? "font-semibold text-clay" : "text-muted"}`}>{data.deadline}</dd>
              </div>
              {data.posted ? (
                <div>
                  <dt className="font-semibold">Date posted</dt>
                  <dd className="mt-1 text-muted">{data.posted}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="mt-6 rounded-2xl border border-line bg-card p-5">
            <h2 className="text-lg font-extrabold">How to apply</h2>
            <ol className="mt-3 list-decimal space-y-3 pl-5 text-base leading-7 text-muted">
              {data.tips.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ol>
            <p className="mt-4 text-sm leading-6">
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
            {data.applyHref ? (
              <a
                href={data.applyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-forest px-5 text-sm font-semibold text-card hover:bg-forest-deep"
              >
                Apply
                <ExternalIcon />
              </a>
            ) : null}
          </section>

          {job.description ? (
            <div className="mt-10">
              <h2 className="text-2xl font-extrabold tracking-tight">Employer advertisement</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                The text below is the public posting from {job.company}. Akazi did not write it.
              </p>
              <div className="mt-6">
                <JobDescription text={job.description} />
              </div>
            </div>
          ) : (
            <p className="mt-10 text-base leading-7 text-muted">
              The employer did not include a longer description. Use the summary above and the original posting.
            </p>
          )}

          {ads?.slot ? <AdSlot client={ads.client} slot={ads.slot} /> : null}

          {data.sourceHref ? (
            <p className="mt-10 border-t border-line pt-4 text-sm leading-6">
              <a className="font-medium text-forest underline-offset-4 hover:underline" href={data.sourceHref} target="_blank" rel="noopener noreferrer">
                View the original posting
              </a>
            </p>
          ) : null}

          {data.related.length > 0 ? (
            <section className="mt-12">
              <h2 className="text-2xl font-extrabold tracking-tight">
                Similar <span className="text-forest">openings</span>
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Other live roles at {job.company}, or in the same kind of work, if Akazi has them.
              </p>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {data.related.map((card) => (
                  <JobCard key={card.job.id} job={card.job} closes={card.closes} soon={card.soon} />
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="h-fit rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)] lg:sticky lg:top-[8.5rem]">
          <h2 className="text-lg font-extrabold">Job overview</h2>
          <dl className="mt-4 grid gap-4 text-sm">
            {data.posted ? (
              <div>
                <dt className="font-semibold">Date posted</dt>
                <dd className="mt-1 text-muted">{data.posted}</dd>
              </div>
            ) : null}
            <div>
              <dt className="font-semibold">Deadline</dt>
              <dd className={`mt-1 ${data.soon ? "font-semibold text-clay" : "text-muted"}`}>{data.deadline}</dd>
            </div>
            {showLocation ? (
              <div>
                <dt className="font-semibold">Location</dt>
                <dd className="mt-1 break-words text-muted">{job.location}</dd>
              </div>
            ) : null}
          </dl>
          {data.applyHref ? (
            <a
              href={data.applyHref}
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
