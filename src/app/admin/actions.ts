"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { ADMIN_COOKIE, isAdmin, passwordsMatch, sessionToken } from "@/lib/admin-auth";

export async function login(formData: FormData) {
  const expected = process.env.ADMIN_PASSWORD;
  const password = String(formData.get("password") ?? "");
  if (!expected || !passwordsMatch(password, expected)) {
    redirect("/admin?error=1");
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, sessionToken(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  redirect("/admin");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin");
}

export async function markReviewed() {
  if (!(await isAdmin())) redirect("/admin");
  db.update(jobs).set({ isNew: false }).where(eq(jobs.isNew, true)).run();
  redirect("/admin");
}
