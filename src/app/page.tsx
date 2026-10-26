import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AdSlot } from "@/components/ad-slot";
import { JobCard } from "@/components/job-card";
import { adConfig } from "@/lib/ads";
import { getBoard, type JobFilters } from "@/lib/jobs";
import { JOB_FUNCTIONS, SHELVES } from "@/lib/organize";

type Search = { [key: string]: string | string[] | undefined };

function one(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function filtersFrom(search: Search): JobFilters {
  return {
    q: one(search.q),
    shelf: one(search.shelf),
    fn: one(search.fn),
    company: one(search.company),
    fresh: one(search.new) === "1",
  };
}

function boardHref(filters: JobFilters, patch: Partial<JobFilters> = {}) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.shelf) params.set("shelf", next.shelf);
  if (next.fn) params.set("fn", next.fn);
  if (next.company) params.set("company", next.company);
  if (next.fresh) params.set("new", "1");
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export default function Home(props: { searchParams: Promise<Search> }) {
  return (
    <main>
      <Suspense fallback={<p className="bg-wash px-4 py-16 text-muted">Loading openings…</p>}>
        <Board searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Board({ searchParams }: { searchParams: Promise<Search> }) {
  const filters = filtersFrom(await searchParams);
  const { openings, closingSoon, freshCount, shelfCounts, functionCounts } = await getBoard(filters);
  const ads = adConfig();
  const filtering = Boolean(filters.q || filters.shelf || filters.fn || filters.company || filters.fresh);
  const showClosing = !filtering && closingSoon.length > 0;
  const closingIds = new Set(showClosing ? closingSoon.map((job) => job.id) : []);
  const rest = showClosing ? openings.filter((job) => !closingIds.has(job.id)) : openings;

  return (
    <div className="bg-wash pb-16">
      {filters.q ? null : (
        <section className="bg-card">
          <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-6 sm:px-6 sm:pt-16 sm:pb-8">
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-ink sm:text-6xl sm:leading-[1.05]">
              Find your next role in <span className="text-forest">Rwanda</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted">
              Our vision is a Rwanda where everyone can reach the work that fits them.
            </p>
          </div>
        </section>
      )}
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid gap-3 pt-8 sm:grid-cols-3">
          {SHELVES.map((shelf) => {
            const selected = filters.shelf === shelf.id;
            const count = shelfCounts[shelf.id];
            return (
              <Link
                key={shelf.id}
                href={boardHref(filters, { shelf: selected ? "" : shelf.id })}
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
          <FilterChip
            href={boardHref(filters, { fresh: !filters.fresh })}
            active={Boolean(filters.fresh)}
            count={freshCount}
            title="Posted in the last 7 days"
          >
            New
          </FilterChip>
          <FilterChip href={boardHref(filters, { fn: "" })} active={!filters.fn}>
            All work
          </FilterChip>
          {JOB_FUNCTIONS.filter((item) => functionCounts[item.id] > 0).map((item) => (
            <FilterChip
              key={item.id}
              href={boardHref(filters, { fn: filters.fn === item.id ? "" : item.id })}
              active={filters.fn === item.id}
              count={functionCounts[item.id]}
            >
              {item.label}
            </FilterChip>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted">
          {openings.length} open {openings.length === 1 ? "role" : "roles"}
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

        {openings.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-line bg-card px-5 py-10 text-muted">
            {filtering
              ? "No openings match these filters."
              : "No openings are listed yet."}
          </p>
        ) : (
          <>
            {showClosing ? (
              <section className="mt-4">
                <h2 className="text-3xl font-extrabold tracking-tight">
                  Closing <span className="text-forest">soon</span>
                </h2>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {closingSoon.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </ul>
              </section>
            ) : null}
            {rest.length > 0 ? (
              <section className="mt-12">
                {showClosing ? (
                  <h2 className="text-3xl font-extrabold tracking-tight">
                    Every <span className="text-forest">opening</span>
                  </h2>
                ) : null}
                <ul className={`${showClosing ? "mt-5" : "mt-4"} grid gap-4 sm:grid-cols-2 lg:grid-cols-3`}>
                  {rest.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
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
