import { sqlite } from "@/db";

export type KeptSubscriber = {
  name: string;
  email: string;
  studies: string;
  cvText: string;
  consentAt: string;
  createdAt: string;
  updatedAt: string;
  /** Jobs already emailed, as `sourceId` + tab + `externalId`. */
  sent?: string[];
};

export type KeptMail = {
  email: string;
  name?: string;
  sourceId: string;
  externalId: string;
  title: string;
  company: string;
  status: string;
  detail: string;
  createdAt: string;
};

type KeptBundle = {
  subscribers: KeptSubscriber[];
  mail: KeptMail[];
  reviewed: string[];
};

function hookReady() {
  return Boolean(process.env.MAIL_HOOK_URL && process.env.MAIL_HOOK_SECRET);
}

async function postHook(body: Record<string, string>, timeoutMs: number) {
  const response = await fetch(process.env.MAIL_HOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret: process.env.MAIL_HOOK_SECRET, ...body }),
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  const reply = await response.text();
  if (!response.ok || !reply.startsWith("ok")) return "";
  return reply;
}

function decodeLine(line: string) {
  try {
    const json = Buffer.from(line, "base64").toString("utf8");
    const row = JSON.parse(json) as { key?: unknown; payload?: unknown };
    if (!row || typeof row.key !== "string" || typeof row.payload !== "string") return null;
    return { key: row.key, payload: row.payload };
  } catch {
    return null;
  }
}

type BucketRow = { key: string; payload: string };

async function readBucket(bucket: string, timeoutMs = 20_000): Promise<{ ok: true; rows: BucketRow[] } | { ok: false }> {
  try {
    const reply = await postHook({ kind: "records", bucket }, timeoutMs);
    if (!reply.startsWith("ok")) return { ok: false };
    const rows: BucketRow[] = [];
    for (const line of reply.split("\n").slice(1)) {
      if (!line.trim()) continue;
      const decoded = decodeLine(line.trim());
      if (decoded) rows.push(decoded);
    }
    return { ok: true, rows };
  } catch {
    return { ok: false };
  }
}

async function listBucket(bucket: string) {
  const result = await readBucket(bucket);
  if (!result.ok) throw new Error("record list failed");
  return result.rows;
}

async function saveRecord(bucket: string, key: string, payload: string) {
  if (!hookReady()) return false;
  try {
    const reply = await postHook({ kind: "record", bucket, key, payload }, 20_000);
    return reply.startsWith("ok");
  } catch {
    return false;
  }
}

/** The old mail log stored one row per role and filled the only lasting store. */
async function dropMailLog() {
  try {
    const reply = await postHook({ kind: "drop", bucket: "mail" }, 25_000);
    return reply.startsWith("ok");
  } catch {
    return false;
  }
}

async function forgetRecord(bucket: string, key: string) {
  if (!hookReady()) return;
  try {
    await postHook({ kind: "forget", bucket, key }, 12_000);
  } catch {
    // A later save replaces the stored copy.
  }
}

function cleanText(value: string, limit: number) {
  return value.replace(/\u0000/g, "").slice(0, limit);
}

function subscriberPayload(row: KeptSubscriber) {
  const sent = (row.sent ?? []).filter((key) => key.includes("\t")).slice(0, 2000);
  const body = {
    name: cleanText(row.name || row.email, 80),
    email: row.email,
    studies: cleanText(row.studies || "", 4000),
    cvText: cleanText(row.cvText || "", 20000),
    consentAt: row.consentAt || row.createdAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt || row.createdAt,
    sent,
  };
  let payload = JSON.stringify(body);
  if (payload.length > 60_000) {
    body.sent = sent.slice(0, 400);
    payload = JSON.stringify(body);
  }
  if (payload.length > 60_000) {
    body.cvText = body.cvText.slice(0, 4000);
    body.studies = body.studies.slice(0, 1500);
    payload = JSON.stringify(body);
  }
  return payload;
}

function sameSignup(row: KeptSubscriber, saved: BucketRow) {
  if (saved.key.toLowerCase() !== row.email.toLowerCase()) return false;
  try {
    const parsed = JSON.parse(saved.payload) as { email?: string };
    return parsed.email?.toLowerCase() === row.email.toLowerCase();
  } catch {
    return false;
  }
}

/** Save the signup where it survives a restart. False when that copy was not stored. */
export async function rememberSubscriber(row: KeptSubscriber) {
  if (!row.email || !row.createdAt) return false;
  if (!hookReady()) return process.env.RENDER !== "true";
  const payload = subscriberPayload(row);
  let saved = await saveRecord("subscriber", row.email, payload);
  for (let attempt = 0; !saved && attempt < 4; attempt += 1) {
    if (!(await dropMailLog())) break;
    saved = await saveRecord("subscriber", row.email, payload);
  }
  invalidateStudyRecords();
  if (!saved) return false;
  const listed = await readBucket("subscriber");
  if (!listed.ok) return true;
  return listed.rows.some((item) => sameSignup(row, item));
}

export async function forgetSubscriber(email: string) {
  await forgetRecord("subscriber", email);
  await forgetCv(email);
  invalidateStudyRecords();
}

export type StoredCv = { name: string; type: string; bytes: Buffer };

function readLocalCv(email: string): StoredCv | null {
  const row = sqlite()
    .prepare("SELECT cv_name AS name, cv_type AS type, cv_file AS bytes FROM subscribers WHERE email = ?")
    .get(email) as { name: string; type: string; bytes: Buffer | null } | undefined;
  if (!row?.bytes || row.bytes.length === 0) return null;
  return { name: row.name || "cv", type: row.type || "application/octet-stream", bytes: row.bytes };
}

function writeLocalCv(email: string, file: StoredCv) {
  sqlite()
    .prepare("UPDATE subscribers SET cv_name = ?, cv_type = ?, cv_file = ? WHERE email = ?")
    .run(file.name, file.type, file.bytes, email);
}

/** Keep the uploaded CV where it survives a restart. The reply must name the stored file, not a mail send. */
export async function rememberCv(email: string, file: { name: string; type: string; bytes: Uint8Array }) {
  if (!email) return false;
  if (!hookReady()) return process.env.RENDER !== "true";
  try {
    const reply = await postHook(
      {
        kind: "cv",
        email,
        filename: file.name,
        mime: file.type,
        data: Buffer.from(file.bytes).toString("base64"),
      },
      45_000,
    );
    return reply.includes("stored");
  } catch {
    return false;
  }
}

async function forgetCv(email: string) {
  if (!hookReady() || !email) return;
  try {
    await postHook({ kind: "cv-forget", email }, 12_000);
  } catch {
    // The signup row is already removed. A later upload replaces the file.
  }
}

async function loadRemoteCv(email: string): Promise<StoredCv | null> {
  if (!hookReady()) return null;
  try {
    const reply = await postHook({ kind: "cv-read", email }, 45_000);
    const lines = reply.split("\n");
    if (lines[1] !== "stored" || lines.length < 5) return null;
    const bytes = Buffer.from(lines.slice(4).join("\n"), "base64");
    if (bytes.length === 0) return null;
    return { name: lines[2] || "cv", type: lines[3] || "application/octet-stream", bytes };
  } catch {
    return null;
  }
}

/** The original uploaded CV, from this server or the lasting copy. */
export async function signupCv(email: string): Promise<StoredCv | null> {
  const local = readLocalCv(email);
  if (local) return local;
  const remote = await loadRemoteCv(email);
  if (!remote) return null;
  writeLocalCv(email, remote);
  return remote;
}

export async function rememberMail(row: KeptMail) {
  const key = `${row.email}\t${row.sourceId}\t${row.externalId}`;
  await saveRecord(
    "mail",
    key,
    JSON.stringify({
      email: row.email,
      name: cleanText(row.name || "", 80),
      sourceId: row.sourceId,
      externalId: row.externalId,
      title: cleanText(row.title, 200),
      company: cleanText(row.company, 160),
      status: row.status,
      detail: cleanText(row.detail, 300),
      createdAt: row.createdAt,
    }),
  );
  invalidateStudyRecords();
}

export async function rememberReviewed(keys: string[]) {
  if (!hookReady() || keys.length === 0) return;
  try {
    const current = new Set((await loadBundle()).reviewed);
    for (const key of keys) current.add(key);
    await saveRecord("seen", "all", JSON.stringify([...current]));
  } catch {
    // The local review still applies for this run of the server.
  }
  invalidateStudyRecords();
}

let bundleTask: Promise<KeptBundle> | null = null;
let bundleAt = 0;

function invalidateStudyRecords() {
  bundleTask = null;
  bundleAt = 0;
}

async function loadBundle(): Promise<KeptBundle> {
  const empty = { subscribers: [], mail: [], reviewed: [] };
  if (!hookReady()) return empty;
  const now = Date.now();
  if (bundleTask && now - bundleAt < 20_000) return bundleTask;
  bundleAt = now;
  bundleTask = fetchBundle().catch((error: unknown) => {
    bundleTask = null;
    bundleAt = 0;
    throw error;
  });
  return bundleTask;
}

async function fetchBundle(): Promise<KeptBundle> {
  const subscribers = await readBucket("subscriber");
  const mailListed = await readBucket("mail");
  const seenListed = await readBucket("seen");
  if (!subscribers.ok && !mailListed.ok) throw new Error("record list failed");
  const mailRows = mailListed.ok ? mailListed.rows : [];
  const seenRows = seenListed.ok ? seenListed.rows : [];
  const people: KeptSubscriber[] = [];
  for (const row of subscribers.ok ? subscribers.rows : []) {
    try {
      const parsed = JSON.parse(row.payload) as KeptSubscriber;
      if (!parsed?.email || parsed.email.toLowerCase() !== row.key.toLowerCase()) continue;
      if (!Array.isArray(parsed.sent)) parsed.sent = [];
      people.push(parsed);
    } catch {
      // Skip a damaged row.
    }
  }
  const mail: KeptMail[] = [];
  for (const row of mailRows) {
    try {
      const parsed = JSON.parse(row.payload) as KeptMail;
      if (!parsed?.email || !parsed.sourceId || !parsed.externalId) continue;
      mail.push(parsed);
    } catch {
      // Skip a damaged row.
    }
  }
  let reviewed: string[] = [];
  const seen = seenRows.find((row) => row.key === "all");
  if (seen) {
    try {
      const parsed = JSON.parse(seen.payload) as unknown;
      if (Array.isArray(parsed)) reviewed = parsed.filter((item) => typeof item === "string");
    } catch {
      reviewed = [];
    }
  }
  return { subscribers: people, mail, reviewed };
}

function applyBundle(bundle: KeptBundle) {
  const db = sqlite();
  const upsertPerson = db.prepare(
    `INSERT INTO subscribers (name, email, studies, cv_text, consent_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET
       name = excluded.name,
       studies = excluded.studies,
       cv_text = excluded.cv_text,
       consent_at = excluded.consent_at,
       updated_at = excluded.updated_at
     WHERE excluded.updated_at >= subscribers.updated_at`,
  );
  const findPerson = db.prepare("SELECT id FROM subscribers WHERE email = ?");
  const findJob = db.prepare("SELECT id FROM jobs WHERE source_id = ? AND external_id = ?");
  const upsertMail = db.prepare(
    `INSERT INTO notifications (subscriber_id, job_id, status, detail, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(subscriber_id, job_id) DO UPDATE SET
       status = excluded.status,
       detail = excluded.detail`,
  );
  const markSeen = db.prepare("UPDATE jobs SET is_new = 0 WHERE source_id = ? AND external_id = ?");

  const write = db.transaction(() => {
    for (const person of bundle.subscribers) {
      if (!person.email || !person.createdAt) continue;
      upsertPerson.run(
        cleanText(person.name || "", 80),
        person.email,
        cleanText(person.studies || "", 4000),
        cleanText(person.cvText || "", 20000),
        person.consentAt || person.createdAt,
        person.createdAt,
        person.updatedAt || person.createdAt,
      );
      const stored = findPerson.get(person.email) as { id: number } | undefined;
      for (const key of person.sent ?? []) {
        const splitAt = key.indexOf("\t");
        if (!stored || splitAt <= 0) continue;
        const job = findJob.get(key.slice(0, splitAt), key.slice(splitAt + 1)) as { id: number } | undefined;
        if (!job) continue;
        upsertMail.run(stored.id, job.id, "sent", null, person.updatedAt || person.createdAt);
      }
    }
    for (const item of bundle.mail) {
      const person = findPerson.get(item.email) as { id: number } | undefined;
      const job = findJob.get(item.sourceId, item.externalId) as { id: number } | undefined;
      if (!person || !job) continue;
      if (item.status !== "sent" && item.status !== "queued" && item.status !== "failed") continue;
      upsertMail.run(person.id, job.id, item.status, item.detail || null, item.createdAt);
    }
    for (const key of bundle.reviewed) {
      const splitAt = key.indexOf("\t");
      if (splitAt <= 0) continue;
      markSeen.run(key.slice(0, splitAt), key.slice(splitAt + 1));
    }
  });
  write();
}

function withMailSignups(bundle: KeptBundle): KeptBundle {
  const people = [...bundle.subscribers];
  const seen = new Set(people.map((person) => person.email.toLowerCase()));
  const earliest = new Map<string, KeptMail>();
  for (const item of bundle.mail) {
    const email = item.email.toLowerCase();
    const current = earliest.get(email);
    if (!current || (item.createdAt && item.createdAt < current.createdAt)) earliest.set(email, item);
  }
  for (const item of earliest.values()) {
    if (seen.has(item.email.toLowerCase()) || !item.createdAt) continue;
    people.push({
      name: item.name || item.email,
      email: item.email,
      studies: "",
      cvText: "",
      consentAt: item.createdAt,
      createdAt: item.createdAt,
      updatedAt: item.createdAt,
    });
  }
  return { ...bundle, subscribers: people };
}

/** Put saved signups, mail history, and reviewed openings back into the local database. */
export async function restoreStudyRecords(): Promise<Set<string>> {
  if (!hookReady()) return new Set();
  try {
    const bundle = await loadBundle();
    const merged = withMailSignups(bundle);
    applyBundle(merged);
    const saved = new Set(bundle.subscribers.map((person) => person.email.toLowerCase()));
    for (const person of merged.subscribers) {
      if (!saved.has(person.email.toLowerCase())) await rememberSubscriber(person);
    }
    return new Set(bundle.reviewed);
  } catch {
    return new Set();
  }
}

let viewerTask: Promise<Map<string, string[]>> | null = null;
let viewerAt = 0;

function invalidateViewers() {
  viewerTask = null;
  viewerAt = 0;
}

async function loadViewers(): Promise<Map<string, string[]>> {
  if (!hookReady()) return new Map();
  const now = Date.now();
  if (viewerTask && now - viewerAt < 20_000) return viewerTask;
  viewerAt = now;
  viewerTask = listBucket("views")
    .then((rows) => {
      const map = new Map<string, string[]>();
      for (const row of rows) {
        try {
          const parsed = JSON.parse(row.payload) as unknown;
          if (!Array.isArray(parsed)) continue;
          const people = parsed.filter((item): item is string => typeof item === "string" && /^[a-f0-9]{32}$/.test(item));
          map.set(row.key, people);
        } catch {
          // Skip a damaged row.
        }
      }
      return map;
    })
    .catch((error: unknown) => {
      viewerTask = null;
      viewerAt = 0;
      throw error;
    });
  return viewerTask;
}

export function viewKey(sourceId: string, externalId: string) {
  return `${sourceId}\t${externalId}`;
}

/** Remember one person on a role so the eye count survives a rebuild. */
export async function rememberJobViewer(sourceId: string, externalId: string, visitor: string) {
  if (!hookReady() || !/^[a-f0-9]{32}$/.test(visitor)) return;
  if (!sourceId || !externalId || sourceId.includes("\t") || externalId.includes("\t")) return;
  try {
    const key = viewKey(sourceId, externalId);
    const map = await loadViewers();
    const people = new Set(map.get(key) ?? []);
    if (people.has(visitor) || people.size >= 5000) return;
    people.add(visitor);
    const next = [...people];
    map.set(key, next);
    await saveRecord("views", key, JSON.stringify(next));
  } catch {
    // The local visit still counts until the next view is saved.
  }
  invalidateViewers();
}

/** People who opened this role. Null when the kept log is not configured. */
export async function jobViewerCount(sourceId: string, externalId: string): Promise<number | null> {
  if (!hookReady()) return null;
  try {
    const map = await loadViewers();
    return (map.get(viewKey(sourceId, externalId)) ?? []).length;
  } catch {
    return null;
  }
}

/** Distinct people for one role, using whichever log currently holds more of them. */
export async function countRoleViewers(publicId: string, job?: { sourceId: string; externalId: string } | null) {
  const local = sqlite()
    .prepare("SELECT COUNT(DISTINCT visitor) AS total FROM visits WHERE path = ?")
    .get(`/jobs/${publicId}`) as { total: number } | undefined;
  const kept = job ? await jobViewerCount(job.sourceId, job.externalId) : null;
  return Math.max(kept ?? 0, Number(local?.total ?? 0));
}

export async function loadKeptMail(): Promise<KeptMail[] | null> {
  if (!hookReady()) return null;
  try {
    return (await loadBundle()).mail;
  } catch {
    return null;
  }
}
