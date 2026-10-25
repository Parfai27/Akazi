import Link from "next/link";
import { Suspense } from "react";
import { login, markReviewed } from "./actions";
import { FunctionBars, SignupColumns, VisitColumns } from "@/components/staff-charts";
import { isAdmin } from "@/lib/admin-auth";
import { mailConfigured } from "@/lib/alerts";
import { getAdminSnapshot } from "@/lib/jobs";
import { getRecentOpens } from "@/lib/staff-directory";
import { getStaffStats, type VisitTotals } from "@/lib/staff-stats";
import { formatPosted } from "@/lib/url";

type Search = { error?: string | string[] };

export const metadata = {
  title: "Staff",
  robots: { index: false, follow: false },
};

export default function AdminPage({ searchParams }: { searchParams: Promise<Search> }) {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-muted">Loading the staff view…</p>}>
      <AdminPanel searchParams={searchParams} />
    </Suspense>
  );
}

function Stat({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <article className="rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)]">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-2 text-4xl font-extrabold tracking-tight text-forest">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{note}</p>
    </article>
  );
}

function formatDay(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function pairNote(totals: VisitTotals, when: string) {
  return `${totals.people} ${totals.people === 1 ? "person" : "people"} · ${totals.visits} ${totals.visits === 1 ? "visit" : "visits"} ${when}`;
}

async function AdminPanel({ searchParams }: { searchParams: Promise<Search> }) {
  const configured = Boolean(process.env.ADMIN_PASSWORD?.trim());
  if (!configured) {
    return <p className="px-4 py-16 text-muted">Set ADMIN_PASSWORD in .env.local, then restart the site.</p>;
  }

  if (!(await isAdmin())) {
    const search = await searchParams;
    const failed = (Array.isArray(search.error) ? search.error[0] : search.error) === "1";
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-16">
        <form action={login} className="w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-[0_8px_24px_rgba(30,107,88,0.06)]">
          <h1 className="text-3xl font-extrabold tracking-tight">Staff</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Visits, alert signups, openings, and the career pages Akazi checks.
          </p>
          <label className="mt-6 block text-sm">
            <span className="mb-1 block font-semibold">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="h-11 w-full rounded-lg border border-line bg-card px-3 text-base outline-none focus:border-forest"
            />
          </label>
          {failed ? <p className="mt-3 text-sm text-clay-deep">That password did not match.</p> : null}
          <button type="submit" className="mt-4 h-11 rounded-lg bg-forest px-4 text-sm font-semibold text-card hover:bg-forest-deep">
            Enter
          </button>
        </form>
      </div>
    );
  }

  const [{ fresh, runs, activeCount, newCount }, stats, recent] = await Promise.all([
    getAdminSnapshot(),
    getStaffStats(),
    getRecentOpens(),
  ]);
  const latest = runs[0];

  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Overview</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          A person is one browser. A visit is a page they open, counted once per page each day. Weeks start on Monday,
          in Rwanda time.{" "}
          {mailConfigured() ? "Alert email is ready to send." : "Alert email is not set up, so matches stay queued."}{" "}
          <Link href="/admin/mail" className="font-semibold text-forest underline-offset-4 hover:underline">
            See mail
          </Link>.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="People" value={stats.all.people} note="Everyone counted so far" />
        <Stat label="People this week" value={stats.week.people} note={pairNote(stats.week, "this week")} />
        <Stat label="Visits this month" value={stats.month.visits} note={pairNote(stats.month, "this month")} />
        <Stat label="Alert signups" value={stats.signupsThisMonth} note={`${stats.signupsTotal} in total · this month shown`} />
        <Stat label="Open roles" value={activeCount} note={`${newCount} not reviewed yet`} />
        <Stat label="People today" value={stats.today.people} note={pairNote(stats.today, "today")} />
        <Stat label="Visits this week" value={stats.week.visits} note="Pages opened since Monday" />
        <Stat
          label="Latest collection"
          value={latest?.jobsSeen ?? 0}
          note={latest ? `${latest.status} · ${formatPosted(latest.startedAt)}` : "No crawl yet"}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <VisitColumns title="Weekly visits" caption="The last eight weeks. Dark bars are people. Light bars are pages opened." points={stats.weeks} />
        <VisitColumns title="Monthly visits" caption="The last six months, including this one." points={stats.months} />
        <FunctionBars rows={stats.functions} />
        <SignupColumns title="Alert signups" caption="People who agreed to email alerts, by month." points={stats.signupMonths} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold tracking-tight">Recently opened roles</h2>
            <Link href="/admin/openings" className="text-sm font-semibold text-forest hover:underline">
              All openings
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No job page has been opened yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {recent.map((item) => (
                <li key={`${item.href}-${item.day}`} className="flex items-baseline justify-between gap-3 py-3">
                  <div>
                    <Link href={item.href} className="font-semibold underline-offset-4 hover:underline">
                      {item.title}
                    </Link>
                    <p className="text-sm text-muted">{item.company}</p>
                  </div>
                  <p className="shrink-0 text-sm text-muted">
                    {item.views} · {formatDay(item.day)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-card p-5 shadow-[0_8px_24px_rgba(30,107,88,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold tracking-tight">New openings</h2>
            {newCount > 0 ? (
              <form action={markReviewed}>
                <button type="submit" className="h-10 rounded-lg bg-forest px-3 text-sm font-semibold text-card hover:bg-forest-deep">
                  Mark all as seen
                </button>
              </form>
            ) : null}
          </div>
          {fresh.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Nothing new since the last review.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {fresh.slice(0, 8).map((job) => (
                <li key={job.id} className="flex items-baseline justify-between gap-3 py-3">
                  <div>
                    <Link href={`/jobs/${job.publicId}`} className="font-semibold underline-offset-4 hover:underline">
                      {job.title}
                    </Link>
                    <p className="text-sm text-muted">
                      {job.company}
                      {job.isActive ? "" : " · no longer listed"}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm text-muted">{formatPosted(job.firstSeenAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <p className="text-xs leading-5 text-muted">
        Visit counts, signup records, mail history, and reviewed openings are kept when the site is rebuilt.
      </p>
    </div>
  );
}
