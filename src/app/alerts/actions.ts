"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { extractText } from "unpdf";
import { db, sqlite } from "@/db";
import { subscribers } from "@/db/schema";
import { mailConfigured, matchSubscriber } from "@/lib/alerts";
import { rememberCv, rememberSubscriber } from "@/lib/record-log";

export type AlertState = {
  error?: string;
  ok?: boolean;
  matched?: number;
  sent?: number;
  queued?: number;
  mailReady?: boolean;
};

function cvFileName(name: string, extension: string) {
  const cleaned = name.replace(/[/\\?%*:|"<>\r\n]/g, "").trim().slice(0, 80);
  const base = cleaned || "cv";
  return base.toLowerCase().endsWith(`.${extension}`) ? base : `${base}.${extension}`;
}

async function readCv(formData: FormData, pasted: string) {
  const file = formData.get("cvFile");
  if (!(file instanceof File) || file.size === 0) return { text: pasted };
  if (file.size > 2_000_000) return { text: pasted, error: "The CV file must be under 2 MB." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || file.type.startsWith("text/")) {
    return {
      text: `${pasted}\n${new TextDecoder().decode(bytes)}`.trim(),
      file: { name: cvFileName(file.name, "txt"), type: "text/plain", bytes },
    };
  }
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    try {
      const extracted = (await extractText(bytes, { mergePages: true })) as { text?: string | string[] };
      const value = extracted.text;
      const pdfText = (Array.isArray(value) ? value.join("\n") : value ?? "").trim();
      if (pdfText.length < 20) {
        return { text: pasted, error: "That PDF had no readable text. Paste your CV instead." };
      }
      return {
        text: `${pasted}\n${pdfText}`.trim(),
        file: { name: cvFileName(file.name, "pdf"), type: "application/pdf", bytes },
      };
    } catch {
      return { text: pasted, error: "That PDF could not be read. Paste your CV instead." };
    }
  }
  return { text: pasted, error: "Upload a PDF or .txt file, or paste your CV." };
}

export async function subscribe(_prev: AlertState, formData: FormData): Promise<AlertState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const studies = String(formData.get("studies") ?? "").trim();
  const pasted = String(formData.get("cv") ?? "").trim();
  const consent = formData.get("consent") === "on";

  if (!name || name.length > 80) return { error: "Enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (!consent) return { error: "Tick the box to agree to email alerts." };

  const cv = await readCv(formData, pasted);
  if (cv.error) return { error: cv.error };
  const cvText = cv.text.trim().slice(0, 20000);
  if (studies.length < 3 && cvText.length < 40) {
    return { error: "Add what you studied, or paste your CV, so matches have something to compare." };
  }

  const now = new Date().toISOString();
  const existing = db.select().from(subscribers).where(eq(subscribers.email, email)).get();
  let subscriberId = existing?.id;
  if (existing) {
    db.update(subscribers)
      .set({ name, studies, cvText, consentAt: now, updatedAt: now })
      .where(eq(subscribers.id, existing.id))
      .run();
  } else {
    const inserted = db
      .insert(subscribers)
      .values({ name, email, studies, cvText, consentAt: now, createdAt: now, updatedAt: now })
      .run();
    subscriberId = Number(inserted.lastInsertRowid);
  }

  if (cv.file) {
    sqlite()
      .prepare("UPDATE subscribers SET cv_name = ?, cv_type = ?, cv_file = ? WHERE id = ?")
      .run(cv.file.name, cv.file.type, Buffer.from(cv.file.bytes), subscriberId);
  }
  const stored = db.select().from(subscribers).where(eq(subscribers.id, subscriberId!)).get();
  if (!stored || !(await rememberSubscriber(stored))) {
    return { error: "Your details could not be saved. Please try again." };
  }
  if (cv.file && !(await rememberCv(stored.email, cv.file))) {
    return { error: "Your CV could not be saved. Please try again." };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/alerts");
  const result = await matchSubscriber(subscriberId!);
  return {
    ok: true,
    matched: result.matched,
    sent: result.sent,
    queued: result.queued,
    mailReady: mailConfigured(),
  };
}
