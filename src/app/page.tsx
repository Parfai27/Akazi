import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Fragment, Suspense, type CSSProperties, type ReactNode } from "react";
import { AdSlot } from "@/components/ad-slot";
import { BellIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, SearchIcon } from "@/components/icons";
import { CompanyMark } from "@/components/company-mark";
import { CountUp } from "@/components/count-up";
import { HeroHills } from "@/components/hero-hills";
import { JobCard } from "@/components/job-card";
import { RecentJobsList } from "@/components/saved-jobs";
import { TimeAgo } from "@/components/time-ago";
import { adConfig } from "@/lib/ads";
import { boardPath, firstPageFilters, getBoard, getLastUpdate, listCompanies, normalizeFilters, type BoardModel, type JobFilters } from "@/lib/jobs";
import { JOB_FUNCTIONS, POSTED_WINDOWS, SHELVES } from "@/lib/organize";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: "Akazi",
    type: "website",
  },
};

/** The hero headline, one entry per masked word. "Rwanda" carries the amber accent; the full stop closes it up. */
const HEADLINE: { text: string; accent?: boolean; end?: boolean }[] = [
  { text: "Find" },
  { text: "your" },
  { text: "next" },
  { text: "role" },
  { text: "in" },
  { text: "Rwanda", accent: true, end: true },
  { text: ".", end: true },
];

type Search = { [key: string]: string | string[] | undefined };

function one(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function filtersFrom(search: Search): JobFilters {
  return normalizeFilters({
    q: one(search.q),
    shelf: one(search.shelf),
    fn: one(search.fn),
    company: one(search.company),
    // "new=1" was the old link for roles posted this week.
    posted: Number(one(search.posted)) || (one(search.new) === "1" ? 7 : 0),
    page: Number(one(search.page)),
  });
}

export default async function Home({ searchParams }: { searchParams: Promise<Search> }) {
  const initial = await getBoard(firstPageFilters());
  return (
    <main>
      <Suspense fallback={<BoardMarkup model={initial} />}>
        <FilteredBoard searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function FilteredBoard({ searchParams }: { searchParams: Promise<Search> }) {
  const model = await getBoard(filtersFrom(await searchParams));
  return <BoardMarkup model={model} entrance />;
}

/** `entrance` plays the hero's opening animation. Only the final, data-filled copy gets it, so the placeholder that
    streams first never plays it and the hero rises in once, not twice. */
function BoardMarkup({ model, entrance = false }: { model: BoardModel; entrance?: boolean }) {
  const filters = model.filters;
  const ads = adConfig();
  const filtering = Boolean(filters.q || filters.shelf || filters.fn || filters.company || filters.posted);
  const showClosing = model.closingSoon.length > 0;

  return (
    <div className="akazi-terrain pb-16">
      {filters.q ? (
        <h1 className="sr-only">Openings matching “{filters.q}”</h1>
      ) : (
        <>
          <section className={`${entrance ? "akazi-hero-enter " : ""}relative isolate overflow-hidden bg-linear-to-b from-[#081a15] via-[#0d2b24] to-[#14463a] text-white`}>
            {/* Kigali Convention Centre at night. Phones: full bleed under an even veil, cropped to the dome.
                From lg: it fills the right two-thirds and fades into the night on the text side. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 lg:left-auto lg:w-[52%] lg:[mask-image:linear-gradient(to_right,transparent,#000_38%)]">
              <div className="akazi-parallax absolute inset-x-0 -top-28 bottom-0">
                <Image
                  src="/people/hero-kigali-night.jpg"
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 52vw, 100vw"
                  className="object-cover object-[18%_center] lg:object-[center_95%]"
                />
              </div>
              <div className="absolute inset-0 bg-[#081a15]/70 lg:bg-transparent" />
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-32 bg-linear-to-b from-[#0b2a22]/60 to-transparent"
            />
            <HeroHills />
            <div aria-hidden="true" className="akazi-grain pointer-events-none absolute inset-0 -z-10" />
            <div className="relative mx-auto grid w-full max-w-6xl items-end gap-10 px-4 pt-10 pb-28 sm:px-6 sm:pt-14 sm:pb-36 lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-40">
              <div>
              <div className="akazi-rise">
                <LiveStatus newToday={model.postedCounts[1] ?? 0} />
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl leading-[0.98] font-extrabold tracking-[-0.045em] sm:text-7xl lg:text-[5.25rem]">
                {HEADLINE.map((word, index) => (
                  <Fragment key={word.text}>
                    <span className="akazi-mask">
                      <span
                        style={{ "--d": `${80 + index * 70}ms` } as CSSProperties}
                        className={`akazi-mask-in ${word.accent ? "text-[#f5b942]" : ""}`}
                      >
                        {word.text}
                      </span>
                    </span>
                    {word.end ? null : " "}
                  </Fragment>
                ))}
              </h1>
              <p style={{ "--d": "180ms" } as CSSProperties} className="akazi-rise mt-6 max-w-xl text-base leading-7 text-[#d6e8e0] sm:text-lg sm:leading-8">
                Our vision is a Rwanda where everyone can reach the work that fits them.
              </p>
              <figure style={{ "--d": "270ms" } as CSSProperties} className="akazi-rise mt-6 max-w-xl border-l-2 border-[#f5b942] pl-5">
                <blockquote className="text-xl leading-snug font-semibold tracking-tight text-white sm:text-2xl">
                  “The only way to do great work is to love what you do.”
                </blockquote>
                <figcaption className="mt-2 text-sm text-[#d6e8e0]">Steve Jobs, Stanford, 2005</figcaption>
              </figure>
              <div style={{ "--d": "360ms" } as CSSProperties} className="akazi-rise">
                <HeroSearch filters={filters} />
              </div>
              </div>
              <div style={{ "--d": "220ms" } as CSSProperties} className="akazi-rise akazi-rise-soft">
                <HeroPeople />
              </div>
            </div>
          </section>
          <HiringMarquee />
        </>
      )}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="akazi-reveal grid gap-3 pt-8 sm:grid-cols-3">
          {SHELVES.map((shelf) => {
            const selected = filters.shelf === shelf.id;
            const count = model.shelfCounts[shelf.id];
            return (
              <Link
                key={shelf.id}
                href={boardPath({ ...filters, shelf: selected ? "" : shelf.id, page: 1 })}
                aria-current={selected ? "true" : undefined}
                className={`rounded-2xl border px-5 py-5 ${
                  selected ? "border-forest bg-forest text-card" : "border-line bg-card text-ink hover:border-forest"
                }`}
              >
                <CountUp value={count} className="block text-3xl font-extrabold leading-none tracking-tight tabular-nums" />
                <span className="mt-2 block text-sm font-semibold">{shelf.label}</span>
                <span className={`mt-1 block text-xs ${selected ? "text-card/80" : "text-muted"}`}>{shelf.hint}</span>
              </Link>
            );
          })}
        </div>

        <WorkSpotlight model={model} />

        <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-labelledby="posted-label">
          <span id="posted-label" className="mr-1 text-sm font-semibold text-muted">
            Posted
          </span>
          <PostedChip href={boardPath({ ...filters, posted: 0, page: 1 })} active={!filters.posted}>
            Any time
          </PostedChip>
          {POSTED_WINDOWS.map((days) => (
            <PostedChip
              key={days}
              href={boardPath({ ...filters, posted: filters.posted === days ? 0 : days, page: 1 })}
              active={filters.posted === days}
              count={model.postedCounts[days]}
            >
              {days === 1 ? "Last 24 hours" : `Last ${days} days`}
            </PostedChip>
          ))}
        </div>

        {filtering ? null : <RecentJobsList limit={6} compact />}

        <p className="mt-8 text-sm text-muted">
          {model.total} open {model.total === 1 ? "role" : "roles"}
          {model.pages > 1 ? ` · page ${model.page} of ${model.pages}` : ""}
          {filtering ? (
            <>
              {" "}
              ·{" "}
              <Link className="inline-flex items-center gap-1 font-medium text-forest underline-offset-4 hover:underline" href="/">
                <CloseIcon className="size-3.5 shrink-0" />
                Clear filters
              </Link>
            </>
          ) : null}
        </p>

        {ads?.slot ? <AdSlot client={ads.client} slot={ads.slot} /> : null}

        {model.total === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-line bg-card px-5 py-10 text-muted">
            {filtering ? "No openings match these filters." : "No openings are listed yet."}
          </p>
        ) : (
          <>
            {showClosing ? (
              <section className="mt-4">
                <h2 className="akazi-wipe text-3xl font-extrabold tracking-tight">
                  Closing <span className="text-forest">soon</span>
                </h2>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {model.closingSoon.map((card) => (
                    <JobCard key={card.job.id} job={card.job} closes={card.closes} soon={card.soon} />
                  ))}
                </ul>
              </section>
            ) : null}
            {model.cards.length > 0 ? (
              <section className="mt-12">
                {showClosing ? (
                  <h2 className="akazi-wipe text-3xl font-extrabold tracking-tight">
                    Every <span className="text-forest">opening</span>
                  </h2>
                ) : null}
                <ul className={`${showClosing ? "mt-5" : "mt-4"} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
                  {model.cards.map((card) => (
                    <JobCard
                      key={card.job.id}
                      job={card.job}
                      closes={card.closes}
                      soon={card.soon}
                      heading={showClosing ? "h3" : "h2"}
                    />
                  ))}
                </ul>
              </section>
            ) : null}
            <Pagination page={model.page} pages={model.pages} filters={filters} />
          </>
        )}
        <AlertsBand />
      </div>
    </div>
  );
}

function Pagination({ page, pages, filters }: { page: number; pages: number; filters: JobFilters }) {
  if (pages <= 1) return null;
  const tokens: Array<number | "gap"> = [];
  let previous = 0;
  for (let n = 1; n <= pages; n += 1) {
    const near = n === 1 || n === pages || Math.abs(n - page) <= 1;
    if (!near) continue;
    if (previous && n - previous > 1) tokens.push("gap");
    tokens.push(n);
    previous = n;
  }
  return (
    <nav className="mt-10 flex flex-wrap items-center gap-2" aria-label="Pagination">
      {page > 1 ? (
        <PageLink href={boardPath({ ...filters, page: page - 1 })}>
          <ChevronLeftIcon />
          Previous
        </PageLink>
      ) : null}
      {tokens.map((token, index) =>
        token === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <PageLink key={token} href={boardPath({ ...filters, page: token })} current={token === page}>
            {token}
          </PageLink>
        ),
      )}
      {page < pages ? (
        <PageLink href={boardPath({ ...filters, page: page + 1 })}>
          Next
          <ChevronRightIcon />
        </PageLink>
      ) : null}
    </nav>
  );
}

function PageLink({ href, current, children }: { href: string; current?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-lg px-3 text-sm font-semibold tabular-nums ${
        current ? "bg-forest text-card" : "border border-line bg-card text-ink hover:border-forest hover:text-forest"
      }`}
    >
      {children}
    </Link>
  );
}

function PostedChip({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count?: number;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium ${
        active ? "bg-ink text-card" : "border border-line bg-card text-ink hover:border-forest hover:text-forest"
      }`}
    >
      {children}
      {count != null ? (
        <span className={`text-xs font-bold tabular-nums ${active ? "text-card/80" : "text-muted"}`}>{count}</span>
      ) : null}
    </Link>
  );
}


/* A slow band of the employers hiring right now, each linking to its company page. The list is rendered twice
   so the loop is seamless; the copy is hidden from assistive tech and keyboard focus. */
async function HiringMarquee() {
  const companies = (await listCompanies()).slice(0, 16);
  if (companies.length < 4) return null;
  const row = (copy: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={copy || undefined}>
      {companies.map((company) => (
        <li key={company.slug} className="flex items-center">
          <Link
            href={`/companies/${company.slug}`}
            tabIndex={copy ? -1 : undefined}
            className="inline-flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-ink hover:underline"
          >
            <CompanyMark name={company.name} website={company.website} size="sm" />
            {company.name}
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] leading-none text-[#f5b942] tabular-nums">
              {company.count}
            </span>
          </Link>
          <BarsGlyph />
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="Companies hiring now" className="akazi-marquee overflow-hidden bg-[#f5b942]">
      <div className="akazi-marquee-track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}

function BarsGlyph() {
  return (
    <svg viewBox="0 0 14 12" className="h-3 w-3.5 shrink-0 text-ink/45" aria-hidden="true">
      <rect x="0" y="6" width="3.2" height="6" rx="1.6" fill="currentColor" />
      <rect x="5.4" y="3" width="3.2" height="9" rx="1.6" fill="currentColor" />
      <rect x="10.8" y="0" width="3.2" height="12" rx="1.6" fill="currentColor" />
    </svg>
  );
}

/* A live line for the hero: when the crawler last ran and how many roles arrived in the last day. */
async function LiveStatus({ newToday }: { newToday: number }) {
  const updated = await getLastUpdate();
  return (
    <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-sm text-[#d6e8e0]">
      <span className="relative flex size-2" aria-hidden="true">
        <span className="akazi-ping absolute inset-0 rounded-full bg-[#6ee7b7]" />
        <span className="relative size-2 rounded-full bg-[#6ee7b7]" />
      </span>
      <span className="font-semibold text-white">Live</span>
      {updated ? (
        <span>
          Updated <TimeAgo iso={updated} />
        </span>
      ) : null}
      {newToday > 0 ? (
        <span>
          <span className="font-semibold text-white tabular-nums">{newToday}</span> new in the last 24 hours
        </span>
      ) : null}
    </p>
  );
}

const HERO_PEOPLE = [
  { src: "/people/hero-1.jpg", alt: "A professional woman smiling with her arms crossed in an office" },
  { src: "/people/hero-2.jpg", alt: "A young man in glasses and a dark shirt smiling" },
  { src: "/people/hero-3.jpg", alt: "A doctor in a white coat with a stethoscope, smiling" },
] as const;

/* Portraits of people at work, with the busiest employer pinned beside them. Photos: Unsplash (see public/people). */
async function HeroPeople() {
  const companies = await listCompanies();
  const top = companies[0];
  const [first, second, third] = HERO_PEOPLE;
  return (
    <>
      <div className="flex items-center gap-3 lg:hidden">
        <div className="flex -space-x-3">
          {HERO_PEOPLE.map((person) => (
            <Image
              key={person.src}
              src={person.src}
              alt=""
              width={44}
              height={44}
              className="size-11 rounded-full object-cover ring-2 ring-[#174f42]"
            />
          ))}
        </div>
        <p className="text-sm text-[#d6e8e0]">
          <span className="font-semibold text-white tabular-nums">{companies.length}</span> employers are hiring right now
        </p>
      </div>

      <div className="relative hidden h-[430px] lg:block">
        <figure className="absolute top-0 right-0 h-[310px] w-[210px] overflow-hidden rounded-t-full rounded-b-[2rem] ring-1 ring-white/20">
          <Image src={first.src} alt={first.alt} fill priority sizes="210px" className="object-cover" />
        </figure>
        <figure className="absolute top-24 left-0 h-[220px] w-[150px] overflow-hidden rounded-t-full rounded-b-[1.75rem] ring-1 ring-white/20">
          <Image src={second.src} alt={second.alt} fill sizes="150px" className="object-cover" />
        </figure>
        <figure className="absolute bottom-0 left-[118px] h-[170px] w-[130px] overflow-hidden rounded-t-full rounded-b-[1.5rem] ring-4 ring-[#174f42]">
          <Image src={third.src} alt={third.alt} fill sizes="130px" className="object-cover" />
        </figure>
        {top ? (
          <p className="akazi-float absolute top-3 left-2 rounded-2xl bg-white px-4 py-3 text-ink shadow-[0_18px_40px_rgba(6,30,24,0.35)]">
            <span className="block text-xs font-semibold text-muted">Hiring the most</span>
            <span className="mt-0.5 block text-sm font-extrabold">{top.name}</span>
            <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-forest tabular-nums">
              <BarsGlyph />
              {top.count} open roles
            </span>
          </p>
        ) : null}
        <p className="akazi-float akazi-float-late absolute right-2 bottom-10 rounded-2xl bg-[#f5b942] px-4 py-3 text-ink shadow-[0_18px_40px_rgba(6,30,24,0.35)]">
          <span className="block text-2xl leading-none font-extrabold tabular-nums">{companies.length}</span>
          <span className="mt-1 block text-xs font-semibold">employers hiring now</span>
        </p>
      </div>
    </>
  );
}

const WORK_PHOTOS: Record<string, string> = {
  education: "/people/work-education.jpg",
  engineering: "/people/work-engineering.jpg",
  finance: "/people/work-finance.jpg",
  people: "/people/work-people.jpg",
  field: "/people/work-field.jpg",
  other: "/people/work-other.jpg",
};

const WORK_BLURBS: Record<string, string> = {
  education: "Teaching, admissions, curriculum and academic roles.",
  engineering: "Software, data, networks and technician roles.",
  finance: "Accounting, audit, procurement and finance roles.",
  people: "Sales, marketing, HR, partnerships and communications.",
  field: "Agriculture, health, nursing, construction and humanitarian work.",
  other: "Operations, research, management and everything in between.",
};

/* The kinds of work as a spotlight: on wider screens six photo strips share one row, and the one you point at (or
   the busiest field, until you do) opens wide in full colour. Each strip filters the board; picking it again clears it. */
function WorkSpotlight({ model }: { model: BoardModel }) {
  const filters = model.filters;
  const kinds = JOB_FUNCTIONS.filter((item) => model.functionCounts[item.id] > 0);
  if (kinds.length === 0) return null;
  const busiest = [...kinds]
    .filter((item) => item.id !== "other")
    .sort((a, b) => model.functionCounts[b.id] - model.functionCounts[a.id])[0];
  const openId = filters.fn || busiest?.id || kinds[0].id;
  return (
    <section
      aria-labelledby="work-heading"
      className="akazi-reveal relative mt-10 overflow-hidden rounded-[2rem] bg-[#0f3a30] p-4 text-white sm:p-7"
    >
      <div aria-hidden="true" className="akazi-grain pointer-events-none absolute inset-0" />
      <div className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 id="work-heading" className="akazi-wipe text-3xl font-extrabold tracking-tight">
            Browse by kind of work
          </h2>
          <p className="mt-1 text-sm text-[#b9d3c8]">Pick a field to filter the openings below.</p>
        </div>
        {filters.fn ? (
          <Link
            href={boardPath({ ...filters, fn: "", page: 1 })}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#f5b942] underline-offset-4 hover:underline"
          >
            <CloseIcon className="size-3.5 shrink-0" />
            Show all work
          </Link>
        ) : null}
      </div>
      <ul className="akazi-kinds relative mt-5">
        {kinds.map((item, index) => {
          const active = filters.fn === item.id;
          const count = model.functionCounts[item.id];
          return (
            <li
              key={item.id}
              className="akazi-kind"
              data-open={item.id === openId ? "" : undefined}
              style={{ "--i": index } as CSSProperties}
            >
              <Link
                href={boardPath({ ...filters, fn: active ? "" : item.id, page: 1 })}
                aria-current={active ? "true" : undefined}
                className={`akazi-wipe-up relative block h-full overflow-hidden rounded-2xl bg-[#0b2a22] ${
                  active ? "ring-2 ring-[#f5b942]" : ""
                }`}
              >
                <Image
                  src={WORK_PHOTOS[item.id] ?? WORK_PHOTOS.other}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 560px, 100vw"
                  className="akazi-kind-photo object-cover"
                />
                <span className="absolute inset-0 bg-linear-to-t from-[#0b2a22] via-[#0b2a22]/55 to-[#0b2a22]/10" />
                <span className="akazi-kind-rail" aria-hidden="true">
                  <span className="akazi-kind-rail-label">{item.label}</span>
                  <span className="rounded-full bg-[#f5b942] px-2 py-0.5 text-xs font-bold text-ink tabular-nums">
                    {count}
                  </span>
                </span>
                <span className="akazi-kind-body">
                  <span className="flex items-baseline gap-3">
                    <span className="text-2xl font-extrabold tracking-tight md:text-3xl">{item.label}</span>
                    <span className="text-sm font-bold text-[#f5b942] tabular-nums">{count} open</span>
                  </span>
                  <span className="akazi-kind-blurb mt-1 block text-sm text-[#d6e8e0]">{WORK_BLURBS[item.id]}</span>
                  <span className="akazi-kind-cta mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#f5b942] px-4 py-2 text-sm font-bold text-ink">
                    {active ? "Showing these roles" : `See ${count} roles`}
                    <ChevronRightIcon />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* The hero's main action: a plain GET form to the board, so it works before any script loads. */
function HeroSearch({ filters }: { filters: JobFilters }) {
  return (
    <form
      action="/"
      method="get"
      role="search"
      aria-label="Search openings"
      className="mt-8 flex max-w-2xl flex-col gap-2 rounded-3xl bg-white p-2 text-ink shadow-[0_24px_60px_rgba(4,20,16,0.45)] sm:flex-row sm:items-center sm:rounded-full"
    >
      <label className="flex min-h-12 flex-1 items-center gap-2.5 rounded-full px-4">
        <SearchIcon className="size-5 shrink-0 text-forest" />
        <span className="sr-only">Job title, company, or city</span>
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Job title, company, or city"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#6b7280]"
        />
      </label>
      <div className="flex gap-2">
        <label className="relative flex min-h-12 flex-1 items-center rounded-full bg-[#eef5f1] sm:flex-none">
          <span className="sr-only">Where</span>
          <select
            name="shelf"
            defaultValue={filters.shelf}
            className="min-h-12 w-full cursor-pointer appearance-none rounded-full bg-transparent pr-9 pl-4 text-sm font-semibold text-ink outline-none focus-visible:ring-3 focus-visible:ring-forest/30"
          >
            <option value="">Anywhere</option>
            {SHELVES.map((shelf) => (
              <option key={shelf.id} value={shelf.id}>
                {shelf.label}
              </option>
            ))}
          </select>
          <ChevronRightIcon className="pointer-events-none absolute right-3 size-4 rotate-90 text-forest" />
        </label>
        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f5b942] px-6 text-sm font-extrabold text-ink hover:bg-[#f0aa22]"
        >
          Search
        </button>
      </div>
    </form>
  );
}

/* A closing call to action for job alerts. It only asks for the field of work, then hands over to the full alerts
   form, which keeps its own name, email, and consent steps. */
function AlertsBand() {
  return (
    <section
      aria-labelledby="alerts-band-title"
      className="akazi-reveal relative mt-16 overflow-hidden rounded-[2rem] bg-[#0f3a30] px-6 py-10 text-white sm:px-10 sm:py-12"
    >
      <div aria-hidden="true" className="akazi-grain pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-[#f5b942]/20 blur-3xl"
      />
      <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
        <div>
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#f5b942] text-ink">
            <BellIcon className="size-6" />
          </span>
          <h2 id="alerts-band-title" className="akazi-wipe mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Get new roles in your field by email
          </h2>
          <p className="mt-3 max-w-lg text-base leading-7 text-[#d6e8e0]">
            Tell us what you studied or do. We&apos;ll email you when a matching opening is posted, and you can stop
            any time.
          </p>
        </div>
        <form action="/alerts" method="get" className="flex flex-col gap-2 rounded-3xl bg-white/10 p-2 sm:flex-row sm:rounded-full">
          <label className="flex-1">
            <span className="sr-only">What you studied or do</span>
            <input
              name="studies"
              required
              maxLength={120}
              placeholder="e.g. accounting, nursing, software"
              className="min-h-12 w-full rounded-full bg-white px-5 text-base text-ink outline-none placeholder:text-[#6b7280] focus-visible:ring-3 focus-visible:ring-[#f5b942]"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f5b942] px-6 text-sm font-extrabold whitespace-nowrap text-ink hover:bg-[#f0aa22]"
          >
            Set up alerts
          </button>
        </form>
      </div>
    </section>
  );
}
