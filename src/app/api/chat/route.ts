import { eq } from "drizzle-orm";
import { connection, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { answerQuestion } from "@/lib/chat";

export async function POST(request: Request) {
  await connection();
  let message = "";
  try {
    const body = (await request.json()) as { message?: unknown };
    if (typeof body.message === "string") message = body.message.slice(0, 500);
  } catch {
    message = "";
  }
  const openings = db.select().from(jobs).where(eq(jobs.isActive, true)).all();
  return NextResponse.json(answerQuestion(message, openings));
}
