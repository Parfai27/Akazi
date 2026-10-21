import Link from "next/link";
import { Suspense } from "react";
import { login, logout, markReviewed } from "./actions";
import { isAdmin } from "@/lib/admin-auth";
import { getAdminSnapshot } from "@/lib/jobs";
import { formatPosted } from "@/lib/url";

type Search = { error?: string | string[] };

export default function AdminPage({ searchParams }: { searchParams: Promise<Search> }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-5 sm:py-10">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">New openings</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Roles that were not in the database the first time a career page was checked. Companies never sign in here.
      </p>
      <Suspense fallback={<p className="mt-8 text-muted">Loading the staff view…</p>}>
        <AdminPanel searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AdminPanel({ searchParams }: { searchParams: Promise<Search> }) {
  const configured = Boolean(process.env.ADMIN_PASSWORD);
  if (!configured) {
    return (
      <p className="mt-8 rounded-2xl border border-dashed border-line bg-card px-5 py-6 text-muted">
        Set <code>ADMIN_PASSWORD</code> in <code>.env.local</code>, then restart the site.
      </p>
    );
  }

  if (!(await isAdmin())) {
    const search = await searchParams;
    const failed = (Array.isArray(search.error) ? search.error[0] : search.error) === "1";
    return (
      <form action={login} className="mt-8 max-w-sm rounded-2xl border border-line bg-card p-5">
        <label className="block text-sm">
          <span className="mb-1 block text-muted">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="min-h-11 w-full rounded-xl border border-line bg-card px-3 text-base outline-none focus:border-forest"
          />
        </label>
        {failed ? <p className="mt-3 text-sm text-clay-deep">That password did not match.</p> : null}
        <button type="submit" className="mt-4 min-h-11 rounded-xl bg-forest px-4 text-sm font-medium text-card">
          Enter
        </button>
      </form>
    );
  }

  const { fresh, runs, activeCount, newCount } = await getAdminSnapshot();

  return (
    <div className="mt-8 grid gap-8">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex gap-6 text-sm">
          <p>
            <span className="block font-serif text-3xl text-forest-deep">{newCount}</span>
            unseen
          </p>
          <p>
            <span className="block font-serif text-3xl text-forest-deep">{activeCount}</span>
            active
          </p>
        </div>
        <div className="flex gap-3">
          {newCount > 0 ? (
            <form action={markReviewed}>
              <button type="submit" className="min-h-11 rounded-xl bg-forest px-4 text-sm font-medium text-card">
                Mark all as seen
              </button>
            </form>
          ) : null}
          <form action={logout}>
            <button type="submit" className="min-h-11 rounded-xl border border-line bg-card px-4 text-sm">
              Log out
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-forest-deep">Since the last review</h2>
        {fresh.length === 0 ? (
          <p className="mt-3 text-muted">Nothing new. Run <code>npm run crawl</code> to check the career pages again.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
            {fresh.map((job) => (
              <li key={job.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
                <div>
                  <Link href={`/jobs/${job.id}`} className="font-medium underline-offset-4 hover:underline">
                    {job.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {job.company}
                    {job.isActive ? "" : " · no longer listed"}
                  </p>
                </div>
                <p className="text-sm text-muted">{formatPosted(job.firstSeenAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif text-2xl text-forest-deep">Collection runs</h2>
        {runs.length === 0 ? (
          <p className="mt-3 text-muted">No runs yet. From the project folder, run <code>npm run crawl</code>.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {runs.map((run) => (
              <li key={run.id} className="rounded-2xl border border-line bg-card px-4 py-4">
                <p className="text-sm">
                  <span className="font-medium capitalize">{run.status}</span>
                  <span className="text-muted">
                    {" "}
                    · {formatPosted(run.startedAt)} · {run.jobsSeen} open · {run.jobsNew} new
                  </span>
                </p>
                {run.notes ? (
                  <pre className="mt-3 overflow-x-auto font-sans text-sm leading-6 whitespace-pre-wrap text-muted">
                    {run.notes}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
