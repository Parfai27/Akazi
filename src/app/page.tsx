import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AdSlot } from "@/components/ad-slot";
import { JobCard } from "@/components/job-card";
import { adConfig } from "@/lib/ads";
import { boardPath, firstPageFilters, getBoard, normalizeFilters, type BoardModel, type JobFilters } from "@/lib/jobs";
import { JOB_FUNCTIONS, SHELVES } from "@/lib/organize";
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
    fresh: one(search.new) === "1",
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
  return <BoardMarkup model={model} />;
}

function BoardMarkup({ model }: { model: BoardModel }) {
  const filters = model.filters;
  const ads = adConfig();
  const filtering = Boolean(filters.q || filters.shelf || filters.fn || filters.company || filters.fresh);
  const showClosing = model.closingSoon.length > 0;

  return (
    <div className="bg-wash pb-16">
      {filters.q ? null : (
        <section className="bg-card">
          <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-6 sm:px-6 sm:pt-16 sm:pb-8">
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-ink sm:text-6xl sm:leading-[1.05]">
              Find your next role in <span className="text-forest">Rwanda</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted">
              Our vision is a Rwanda where everyone can reach the work that fits them. Openings are gathered from public
              employer career pages, and you apply on their site.
            </p>
            <p className="mt-4 text-sm font-semibold">
              <Link href="/guides" className="text-forest underline-offset-4 hover:underline">
                Guides on CVs, interviews, and remote work
              </Link>
            </p>
          </div>
        </section>
      )}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-3 pt-8 sm:grid-cols-3">
          {SHELVES.map((shelf) => {
            const selected = filters.shelf === shelf.id;
            const count = model.shelfCounts[shelf.id];
            return (
              <Link
                key={shelf.id}
                href={boardPath({ ...filters, shelf: selected ? "" : shelf.id, page: 1 })}
                className={`rounded-2xl border px-5 py-5 ${
                  selected ? "border-forest bg-forest text-card" : "border-line bg-card text-ink hover:border-forest"
                }`}
              >
                <span className="block text-3xl font-extrabold leading-none tracking-tight">{count}</span>
                <span className="mt-2 block text-sm font-semibold">{shelf.label}</span>
                <span className={`mt-1 block text-xs ${selected ? "text-card/80" : "text-muted"}`}>{shelf.hint}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-3 pt-2">
          <FilterChip href={boardPath({ ...filters, fn: "", fresh: false, page: 1 })} active={!filters.fn && !filters.fresh}>
            All work
          </FilterChip>
          <FilterChip
            href={boardPath({ ...filters, fresh: !filters.fresh, fn: "", page: 1 })}
            active={filters.fresh}
            count={model.freshCount}
            title="Posted in the last 7 days"
          >
            New
          </FilterChip>
          {JOB_FUNCTIONS.filter((item) => model.functionCounts[item.id] > 0).map((item) => (
            <FilterChip
              key={item.id}
              href={boardPath({ ...filters, fn: filters.fn === item.id ? "" : item.id, fresh: false, page: 1 })}
              active={filters.fn === item.id}
              count={model.functionCounts[item.id]}
            >
              {item.label}
            </FilterChip>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted">
          {model.total} open {model.total === 1 ? "role" : "roles"}
          {model.pages > 1 ? ` · page ${model.page} of ${model.pages}` : ""}
          {filtering ? (
            <>
              {" "}
              ·{" "}
              <Link className="font-medium text-forest underline-offset-4 hover:underline" href="/">
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
                <h2 className="text-3xl font-extrabold tracking-tight">
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
                  <h2 className="text-3xl font-extrabold tracking-tight">
                    Every <span className="text-forest">opening</span>
                  </h2>
                ) : null}
                <ul className={`${showClosing ? "mt-5" : "mt-4"} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
                  {model.cards.map((card) => (
                    <JobCard key={card.job.id} job={card.job} closes={card.closes} soon={card.soon} />
                  ))}
                </ul>
              </section>
            ) : null}
            <Pagination page={model.page} pages={model.pages} filters={filters} />
          </>
        )}
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
      {page > 1 ? <PageLink href={boardPath({ ...filters, page: page - 1 })}>Previous</PageLink> : null}
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
      {page < pages ? <PageLink href={boardPath({ ...filters, page: page + 1 })}>Next</PageLink> : null}
    </nav>
  );
}

function PageLink({ href, current, children }: { href: string; current?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-semibold ${
        current ? "bg-forest text-card" : "border border-line bg-card text-ink hover:border-forest hover:text-forest"
      }`}
    >
      {children}
    </Link>
  );
}

function FilterChip({
  href,
  active,
  count,
  title,
  children,
}: {
  href: string;
  active: boolean;
  count?: number;
  title?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      title={title}
      className={`relative inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium ${
        active ? "bg-forest text-card" : "border border-line bg-card text-ink hover:border-forest hover:text-forest"
      }`}
    >
      {children}
      {count != null ? (
        <span
          className={`absolute -top-2.5 right-0 z-10 inline-flex h-5 min-w-5 translate-x-1/2 items-center justify-center rounded-full px-1 text-[11px] font-bold leading-none ring-2 ring-wash ${
            active ? "bg-card text-forest" : "bg-forest text-card"
          }`}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
