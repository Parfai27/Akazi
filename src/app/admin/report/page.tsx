import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Logo } from "@/components/logo";
import { PrintReport } from "@/components/print-report";
import { isAdmin } from "@/lib/admin-auth";
import { reportGeneratedAt, validateReport, type ReportPlace, type ReportStatus } from "@/lib/report-range";
import { reportOpenings } from "@/lib/staff-report";

export const instant = false;

export const metadata = {
  title: "Report",
  robots: { index: false, follow: false },
};

type Search = { from?: string; to?: string; status?: string; place?: string };

const STATUSES: { id: ReportStatus; label: string }[] = [
  { id: "all", label: "All openings" },
  { id: "open", label: "Open" },
  { id: "closed", label: "Closed" },
];

const PLACES: { id: ReportPlace; label: string }[] = [
  { id: "all", label: "All places" },
  { id: "kigali", label: "Kigali" },
  { id: "rwanda", label: "Elsewhere in Rwanda" },
  { id: "remote", label: "Remote" },
];

function slashDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : iso;
}

export default async function ReportPage({ searchParams }: { searchParams: Promise<Search> }) {
  if (!(await isAdmin())) redirect("/admin");
  const search = await searchParams;
  const submitted = search.from !== undefined || search.to !== undefined;
  if (submitted) await connection();
  const result = submitted ? validateReport(search) : null;
  const rows = result?.ok ? await reportOpenings(result.query) : [];
  const openCount = rows.filter((row) => row.status === "Open").length;
  const opens = rows.reduce((sum, row) => sum + row.views, 0);
  const statusLabel = result?.ok ? (STATUSES.find((item) => item.id === result.query.status)?.label ?? "All openings") : "All openings";
  const placeName = result?.ok ? (PLACES.find((item) => item.id === result.query.place)?.label ?? "All places") : "All places";

  return (
    <div>
      <style>{`@media print { .staff-chrome { display: none !important; } body { background: #fff; } }`}</style>
      <div className="print:hidden">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Report</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Openings Akazi listed between two dates. Both dates are required, the first must be on or before the last, and
          the last cannot be after today.
        </p>
        <form action="/admin/report" className="mt-6 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block font-semibold">From</span>
            <input
              name="from"
              type="date"
              required
              defaultValue={search.from ?? ""}
              className="h-11 rounded-lg border border-line bg-card px-3 text-base outline-none focus:border-forest"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold">To</span>
            <input
              name="to"
              type="date"
              required
              defaultValue={search.to ?? ""}
              className="h-11 rounded-lg border border-line bg-card px-3 text-base outline-none focus:border-forest"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold">Status</span>
            <select
              name="status"
              defaultValue={search.status ?? "all"}
              className="h-11 rounded-lg border border-line bg-card px-3 text-base outline-none focus:border-forest"
            >
              {STATUSES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-semibold">Place</span>
            <select
              name="place"
              defaultValue={search.place ?? "all"}
              className="h-11 rounded-lg border border-line bg-card px-3 text-base outline-none focus:border-forest"
            >
              {PLACES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="h-11 rounded-lg bg-forest px-4 text-sm font-semibold text-card hover:bg-forest-deep">
            Generate
          </button>
          {result?.ok ? <PrintReport /> : null}
        </form>
        {result && !result.ok ? <p className="mt-3 text-sm text-clay-deep">{result.error}</p> : null}
      </div>

      {result?.ok ? (
        <article className="mx-auto mt-8 max-w-4xl bg-card px-5 py-6 text-ink shadow-[0_8px_24px_rgba(30,107,88,0.06)] print:mt-0 print:max-w-none print:shadow-none">
          <header className="grid items-start gap-4 border-b-2 border-forest pb-4 sm:grid-cols-[auto_1fr] sm:gap-6">
            <Logo />
            <div className="text-center">
              <p className="text-sm font-bold tracking-[0.14em]">AKAZI</p>
              <h2 className="mt-1 text-xl font-bold tracking-wide text-forest">STAFF REPORT</h2>
              <p className="mt-1 text-xs">Openings listed within the selected reporting period.</p>
              <p className="mt-1 text-xs">
                Period: {result.query.from} to {result.query.to} - Generated: {reportGeneratedAt()}
              </p>
            </div>
          </header>
          <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span>
              <span className="font-semibold">Period:</span> {result.query.from} to {result.query.to}
            </span>
            <span>
              <span className="font-semibold">Status:</span> {statusLabel}
            </span>
            <span>
              <span className="font-semibold">Place:</span> {placeName}
            </span>
          </p>
          <h3 className="mt-5 border-t-2 border-forest pt-3 text-sm font-bold tracking-wide text-forest">OPENING RECORDS</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-forest text-xs font-bold tracking-wide text-card uppercase">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Employer</th>
                  <th className="px-3 py-2">Listed</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Opens</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr className="border-b border-line">
                    <td colSpan={6} className="px-3 py-6 text-muted">
                      No openings were listed in this period.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={`${row.title}-${row.company}-${row.listedOn}-${index}`} className="border-b border-line">
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2">{row.title}</td>
                      <td className="px-3 py-2">{row.company}</td>
                      <td className="px-3 py-2">{slashDate(row.listedOn)}</td>
                      <td className="px-3 py-2 font-semibold uppercase">{row.status}</td>
                      <td className="px-3 py-2 text-right">{row.views}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-full bg-forest px-5 py-3 text-sm font-bold text-card">
            <span>
              {rows.length} {rows.length === 1 ? "opening" : "openings"} · {openCount} open
            </span>
            <span>Opens: {opens}</span>
          </footer>
        </article>
      ) : null}
    </div>
  );
}
