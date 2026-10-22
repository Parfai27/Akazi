import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { getAdminSnapshot } from "@/lib/jobs";
import { getSourceRows } from "@/lib/staff-directory";
import { formatPosted } from "@/lib/url";

export const metadata = {
  title: "Sources",
  robots: { index: false, follow: false },
};

export default async function SourcesPage() {
  if (!(await isAdmin())) redirect("/admin");
  const [sources, { runs }] = await Promise.all([getSourceRows(), getAdminSnapshot()]);
  const latest = runs[0];

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Sources</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        Career pages Akazi reads. A failed read does not remove that employer’s current openings.
      </p>
      {latest ? (
        <p className="mt-4 text-sm text-muted">
          Last collection: <span className="font-semibold capitalize text-ink">{latest.status}</span> ·{" "}
          {formatPosted(latest.startedAt)} · {latest.jobsSeen} open · {latest.jobsNew} new
        </p>
      ) : null}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-line text-xs font-semibold tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3">Employer</th>
              <th className="px-4 py-3">Feed</th>
              <th className="px-4 py-3">Open</th>
              <th className="px-4 py-3">Seen</th>
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-muted">
                  No career pages have been collected yet.
                </td>
              </tr>
            ) : (
              sources.map((source) => (
              <tr key={source.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <a className="font-semibold text-forest underline-offset-4 hover:underline" href={source.careerUrl} target="_blank" rel="noopener noreferrer">
                    {source.name}
                  </a>
                </td>
                <td className="px-4 py-3 capitalize text-muted">{source.type}</td>
                <td className="px-4 py-3 font-semibold">{source.openCount}</td>
                <td className="px-4 py-3 text-muted">{source.totalCount}</td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {latest?.notes ? (
        <pre className="mt-4 overflow-x-auto rounded-2xl border border-line bg-card p-4 font-sans text-sm leading-6 whitespace-pre-wrap text-muted">
          {latest.notes}
        </pre>
      ) : null}
    </div>
  );
}
