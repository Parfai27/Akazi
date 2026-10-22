import { connection, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getAlertRows, getOpeningRows } from "@/lib/staff-directory";

function cell(value: string | number | boolean) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function csv(rows: (string | number | boolean)[][]) {
  return rows.map((row) => row.map(cell).join(",")).join("\n");
}

export async function GET(request: Request) {
  await connection();
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin", request.url));
  const kind = new URL(request.url).searchParams.get("kind");
  if (kind === "alerts") {
    const rows = await getAlertRows();
    const body = csv([
      ["Name", "Email", "Studies", "CV saved", "Signed up"],
      ...rows.map((row) => [row.name, row.email, row.studies, row.hasCv ? "yes" : "no", row.createdAt]),
    ]);
    return new NextResponse(body, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="akazi-alerts.csv"',
      },
    });
  }
  const rows = await getOpeningRows();
  const body = csv([
    ["Role", "Employer", "Type", "Opens", "Deadline", "Open", "New"],
    ...rows.map((row) => [row.title, row.company, row.role, row.views, row.deadline ?? "", row.active ? "yes" : "no", row.isNew ? "yes" : "no"]),
  ]);
  return new NextResponse(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="akazi-openings.csv"',
    },
  });
}
