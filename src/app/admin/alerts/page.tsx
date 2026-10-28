import { redirect } from "next/navigation";
import { AlertTable } from "@/components/alert-table";
import { isAdmin } from "@/lib/admin-auth";
import { getAlertRows } from "@/lib/staff-directory";

export const instant = false;

export const metadata = {
  title: "Alerts",
  robots: { index: false, follow: false },
};

export default async function AlertsPage() {
  if (!(await isAdmin())) redirect("/admin");
  const rows = await getAlertRows();

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Alerts</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        People who agreed to be emailed when an opening matches their studies or CV. Remove a row if they ask to stop.
        These details are not sold.
      </p>
      {rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line bg-card px-5 py-10 text-sm text-muted">
          No one has signed up yet.
        </p>
      ) : (
        <div className="mt-6">
          <AlertTable rows={rows} />
        </div>
      )}
    </div>
  );
}
