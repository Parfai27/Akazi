import { sqlite } from "@/db";

export type KeptSubscriber = {
  name: string;
  email: string;
  studies: string;
  cvText: string;
  consentAt: string;
  createdAt: string;
  updatedAt: string;
};

export type KeptMail = {
  email: string;
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

async function listBucket(bucket: string) {
  const reply = await postHook({ kind: "records", bucket }, 12_000);
  const rows: { key: string; payload: string }[] = [];
  for (const line of reply.split("\n").slice(1)) {
    if (!line.trim()) continue;
    const decoded = decodeLine(line.trim());
    if (decoded) rows.push(decoded);
  }
  return rows;
}

async function saveRecord(bucket: string, key: string, payload: string) {
  if (!hookReady()) return;
  try {
    await postHook({ kind: "record", bucket, key, payload }, 12_000);
  } catch {
    // The local row remains until the next successful save.
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

export async function rememberSubscriber(row: KeptSubscriber) {
  await saveRecord(
    "subscriber",
    row.email,
    JSON.stringify({
      name: cleanText(row.name, 80),
      email: row.email,
      studies: cleanText(row.studies, 4000),
      cvText: cleanText(row.cvText, 20000),
      consentAt: row.consentAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }),
  );
  invalidateStudyRecords();
}

export async function forgetSubscriber(email: string) {
  await forgetRecord("subscriber", email);
  invalidateStudyRecords();
}

export async function rememberMail(row: KeptMail) {
  const key = `${row.email}\t${row.sourceId}\t${row.externalId}`;
  await saveRecord(
    "mail",
    key,
    JSON.stringify({
      email: row.email,
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
  const [subscribers, mailRows, seenRows] = await Promise.all([
    listBucket("subscriber"),
    listBucket("mail"),
    listBucket("seen"),
  ]);
  const people: KeptSubscriber[] = [];
  for (const row of subscribers) {
    try {
      const parsed = JSON.parse(row.payload) as KeptSubscriber;
      if (!parsed?.email || parsed.email !== row.key) continue;
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
      upsertPerson.run(
        cleanText(person.name || "", 80),
        person.email,
        cleanText(person.studies || "", 4000),
        cleanText(person.cvText || "", 20000),
        person.consentAt || person.createdAt,
        person.createdAt,
        person.updatedAt || person.createdAt,
      );
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

/** Put saved signups, mail history, and reviewed openings back into the local database. */
export async function restoreStudyRecords(): Promise<Set<string>> {
  if (!hookReady()) return new Set();
  try {
    const bundle = await loadBundle();
    applyBundle(bundle);
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
