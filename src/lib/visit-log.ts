type VisitRow = {
  day: string;
  visitor: string;
  path: string;
  jobFunction: string | null;
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
  if (!response.ok || !reply.includes("ok")) return "";
  return reply;
}

/** Keep one page view where a restart cannot wipe it. Failures stay in the local database. */
export async function rememberVisit(row: VisitRow) {
  if (!hookReady()) return;
  try {
    await postHook(
      {
        kind: "visit",
        day: row.day,
        visitor: row.visitor,
        path: row.path,
        jobFunction: row.jobFunction ?? "",
      },
      5_000,
    );
  } catch {
    // The local row still counts until a later visit is saved.
  }
}

export async function loadRememberedVisits(): Promise<VisitRow[]> {
  if (!hookReady()) return [];
  try {
    const reply = await postHook({ kind: "visits" }, 8_000);
    const rows: VisitRow[] = [];
    for (const line of reply.split("\n")) {
      const [day, visitor, path, role = ""] = line.split("|");
      if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
      if (!visitor || !/^[a-f0-9]{32}$/.test(visitor)) continue;
      if (/^(.)\1{31}$/.test(visitor)) continue;
      if (!path || !path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) continue;
      rows.push({ day, visitor, path, jobFunction: /^[a-z]{1,20}$/.test(role) ? role : null });
    }
    return rows;
  } catch {
    return [];
  }
}

export function mergeVisits(local: VisitRow[], remembered: VisitRow[]) {
  const merged = new Map<string, VisitRow>();
  for (const row of [...remembered, ...local]) {
    const key = `${row.day}|${row.visitor}|${row.path}`;
    const previous = merged.get(key);
    if (!previous) merged.set(key, row);
    else if (!previous.jobFunction && row.jobFunction) merged.set(key, { ...previous, jobFunction: row.jobFunction });
  }
  return [...merged.values()];
}
