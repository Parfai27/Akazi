import { connection, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { getSignup } from "@/lib/staff-directory";

function fileName(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${slug || "signup"}-cv.txt`;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await connection();
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/admin", request.url));
  const { id } = await context.params;
  const person = await getSignup(Number(id));
  if (!person?.cvText) {
    return new NextResponse("No CV was saved for this signup.\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return new NextResponse(person.cvText, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="${fileName(person.name)}"`,
    },
  });
}
