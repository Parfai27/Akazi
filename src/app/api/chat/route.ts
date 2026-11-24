import { eq } from "drizzle-orm";
import { connection, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs } from "@/db/schema";
import { answerQuestion } from "@/lib/chat";
import { answerWithAi, type ChatTurn } from "@/lib/chat-ai";
import { allowAi } from "@/lib/groq";
import { deadlineOpen } from "@/lib/organize";

function readHistory(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (turn): turn is ChatTurn =>
        Boolean(turn) &&
        (turn.from === "visitor" || turn.from === "akazi") &&
        typeof turn.text === "string" &&
        turn.text.trim().length > 0,
    )
    .slice(-8)
    .map((turn) => ({ from: turn.from, text: turn.text.slice(0, 1000) }));
}

export async function POST(request: Request) {
  await connection();
  let message = "";
  let history: ChatTurn[] = [];
  try {
    const body = (await request.json()) as { message?: unknown; history?: unknown };
    if (typeof body.message === "string") message = body.message.slice(0, 500);
    history = readHistory(body.history);
  } catch {
    message = "";
  }
  const openings = db
    .select()
    .from(jobs)
    .where(eq(jobs.isActive, true))
    .all()
    .filter((job) => deadlineOpen(job.deadlineAt));

  if (message.trim() && allowAi(request)) {
    const answer = await answerWithAi(message, history, openings);
    if (answer) return NextResponse.json(answer);
  }
  return NextResponse.json(answerQuestion(message, openings));
}
