import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { mailConfigured } from "@/lib/alerts";
import { getMailLog } from "@/lib/staff-directory";
import { formatPosted } from "@/lib/url";

export const metadata = {
  title: "Mail",
  robots: { index: false, follow: false },
};

export default async function MailPage() {
  if (!(await isAdmin())) redirect("/admin");
  const ready = mailConfigured();
  const { summary, rows } = await getMailLog();

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Mail</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        {ready
          ? "Email is ready. One note can cover several roles. Matches go out when someone signs up and when a new opening is collected."
          : "Email is not set up. Matches are saved here as queued until SMTP is added in the host settings."}
      </p>
      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm font-semibold text-muted">Sent</p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-forest">{summary.sent}</p>
        </article>
        <article className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm font-semibold text-muted">Queued</p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-forest">{summary.queued}</p>
        </article>
        <article className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm font-semibold text-muted">Failed</p>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-clay-deep">{summary.failed}</p>
        </article>
      </section>
      {rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line bg-card px-5 py-10 text-sm text-muted">
          No alert emails have been recorded yet. Signups are listed under{" "}
          <Link href="/admin/alerts" className="font-semibold text-forest underline-offset-4 hover:underline">
            Alerts
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line text-xs font-semibold tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Person</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-muted">{row.email}</p>
                  </td>
                  <td className="px-4 py-3">{row.title}</td>
                  <td className="px-4 py-3 capitalize">
                    {row.status}
                    {row.detail ? <p className="text-xs text-muted">{row.detail}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{formatPosted(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
