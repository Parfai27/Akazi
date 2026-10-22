import { redirect } from "next/navigation";
import { OpeningTable } from "@/components/opening-table";
import { isAdmin } from "@/lib/admin-auth";
import { getOpeningRows } from "@/lib/staff-directory";

export const metadata = {
  title: "Openings",
  robots: { index: false, follow: false },
};

export default async function OpeningsPage() {
  if (!(await isAdmin())) redirect("/admin");
  const rows = await getOpeningRows();
  const open = rows.filter((row) => row.active).length;

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Openings</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
        {open} open roles. Opens are how many times someone viewed that job page. The same person counts once per day.
      </p>
      <div className="mt-6">
        <OpeningTable rows={rows} />
      </div>
    </div>
  );
}
