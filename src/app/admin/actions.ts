"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, sqlite } from "@/db";
import { jobs, notifications, subscribers } from "@/db/schema";
import { forgetSubscriber, rememberReviewed } from "@/lib/record-log";
import { ADMIN_COOKIE, adminPassword, isAdmin, passwordsMatch, sessionToken } from "@/lib/admin-auth";

export async function login(formData: FormData) {
  const expected = adminPassword();
  const password = String(formData.get("password") ?? "").trim();
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
  const fresh = sqlite()
    .prepare("SELECT source_id AS sourceId, external_id AS externalId FROM jobs WHERE is_new = 1")
    .all() as { sourceId: string; externalId: string }[];
  await rememberReviewed(fresh.map((row) => `${row.sourceId}\t${row.externalId}`));
  db.update(jobs).set({ isNew: false }).where(eq(jobs.isNew, true)).run();
  redirect("/admin");
}

export async function removeSubscriber(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) redirect("/admin/alerts");
  const person = db.select({ email: subscribers.email }).from(subscribers).where(eq(subscribers.id, id)).get();
  db.delete(notifications).where(eq(notifications.subscriberId, id)).run();
  db.delete(subscribers).where(eq(subscribers.id, id)).run();
  if (person) await forgetSubscriber(person.email);
  redirect("/admin/alerts");
}
