import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { jobKey } from "../lib/job-key";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
};

function openDatabase() {
  const directory = path.join(process.cwd(), "data");
  fs.mkdirSync(directory, { recursive: true });
  const sqlite = new Database(path.join(directory, "jobs.sqlite"));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      career_url TEXT NOT NULL,
      type TEXT NOT NULL,
      board_token TEXT
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT NOT NULL,
      source_id TEXT NOT NULL,
      external_id TEXT NOT NULL,
      title TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      work_mode TEXT NOT NULL,
      place TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      apply_url TEXT NOT NULL,
      source_url TEXT NOT NULL,
      posted_at TEXT,
      deadline_at TEXT,
      first_seen_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_new INTEGER NOT NULL DEFAULT 1
    );

    CREATE UNIQUE INDEX IF NOT EXISTS jobs_source_external
      ON jobs (source_id, external_id);

    CREATE INDEX IF NOT EXISTS jobs_active_idx
      ON jobs (is_active, place, work_mode);

    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      studies TEXT NOT NULL DEFAULT '',
      cv_text TEXT NOT NULL DEFAULT '',
      consent_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscriber_id INTEGER NOT NULL,
      job_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      detail TEXT,
      created_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS notifications_subscriber_job
      ON notifications (subscriber_id, job_id);

    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day TEXT NOT NULL,
      visitor TEXT NOT NULL,
      path TEXT NOT NULL,
      job_function TEXT,
      created_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS visits_day_visitor_path
      ON visits (day, visitor, path);

    CREATE INDEX IF NOT EXISTS visits_day_idx ON visits (day);

    CREATE TABLE IF NOT EXISTS crawl_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      sources_checked INTEGER NOT NULL DEFAULT 0,
      jobs_seen INTEGER NOT NULL DEFAULT 0,
      jobs_new INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      notes TEXT
    );
  `);
  const jobColumns = sqlite.prepare("PRAGMA table_info(jobs)").all() as { name: string }[];
  if (!jobColumns.some((column) => column.name === "deadline_at")) {
    sqlite.exec("ALTER TABLE jobs ADD COLUMN deadline_at TEXT");
  }
  if (!jobColumns.some((column) => column.name === "public_id")) {
    sqlite.exec("ALTER TABLE jobs ADD COLUMN public_id TEXT");
  }
  const missing = sqlite
    .prepare("SELECT id, source_id AS sourceId, external_id AS externalId FROM jobs WHERE public_id IS NULL OR public_id = ''")
    .all() as { id: number; sourceId: string; externalId: string }[];
  const assign = sqlite.prepare("UPDATE jobs SET public_id = ? WHERE id = ?");
  for (const row of missing) assign.run(jobKey(row.sourceId, row.externalId), row.id);
  sqlite.exec("CREATE UNIQUE INDEX IF NOT EXISTS jobs_public_id ON jobs (public_id)");
  return sqlite;
}

function getSqlite() {
  if (!globalForDb.sqlite) {
    globalForDb.sqlite = openDatabase();
  }
  return globalForDb.sqlite;
}

export function checkpointDatabase() {
  getSqlite().pragma("wal_checkpoint(TRUNCATE)");
}

export function sqlite() {
  return getSqlite();
}

export const db = drizzle(getSqlite(), { schema });
