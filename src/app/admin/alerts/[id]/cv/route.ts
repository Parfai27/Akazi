import { connection, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { signupCv } from "@/lib/record-log";
import { getSignup } from "@/lib/staff-directory";

function downloadName(name: string) {
  const cleaned = name.replace(/[/\\?%*:|"<>\r\n]/g, "").trim().slice(0, 80);
  return cleaned || "cv.txt";
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin", request.url));
  const { id } = await context.params;
  const person = await getSignup(Number(id));
  if (!person) {
    return new NextResponse("No CV was saved for this signup.\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  const file = await signupCv(person.email);
  const view = new URL(request.url).searchParams.get("view") === "1";
  if (file) {
    return new NextResponse(new Uint8Array(file.bytes), {
      headers: {
        "content-type": file.type || "application/octet-stream",
        "content-disposition": `${view ? "inline" : "attachment"}; filename="${downloadName(file.name)}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  }
  if (!person.cvText) {
    return new NextResponse("No CV was saved for this signup.\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  const slug = person.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return new NextResponse(person.cvText, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${slug || "signup"}-cv.txt"`,
      "cache-control": "private, no-store",
    },
  });
}
