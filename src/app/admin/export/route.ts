import { connection, NextResponse } from "next/server";
import { alertsReportPdf } from "@/lib/alerts-report-pdf";
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
    const pdf = await alertsReportPdf(rows);
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": 'attachment; filename="akazi-alerts.pdf"',
        "cache-control": "private, no-store",
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
