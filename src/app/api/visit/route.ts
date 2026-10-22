import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { connection, NextResponse } from "next/server";
import { recordVisit } from "@/lib/staff-stats";

const COOKIE = "akazi_vid";

function safePath(value: unknown) {
  if (typeof value !== "string") return "";
  const path = value.split("?")[0]?.trim() ?? "";
  if (!path.startsWith("/") || path.startsWith("//") || path.length > 180) return "";
  if (path.startsWith("/admin") || path.startsWith("/api")) return "";
  return path;
}

export async function POST(request: Request) {
  await connection();
  const jar = await cookies();
  const current = jar.get(COOKIE)?.value ?? "";
  const visitor = /^[a-f0-9]{32}$/.test(current) ? current : randomBytes(16).toString("hex");
  let path = "";
  try {
    const body = (await request.json()) as { path?: unknown };
    path = safePath(body.path);
  } catch {
    path = "";
  }
  if (path) await recordVisit(visitor, path);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, visitor, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return response;
}
