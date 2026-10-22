import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  careerUrl: text("career_url").notNull(),
  type: text("type").notNull(),
  boardToken: text("board_token"),
});

export const jobs = sqliteTable(
  "jobs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sourceId: text("source_id").notNull(),
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    company: text("company").notNull(),
    location: text("location").notNull().default(""),
    workMode: text("work_mode").notNull(),
    place: text("place").notNull(),
    description: text("description").notNull().default(""),
    applyUrl: text("apply_url").notNull(),
    sourceUrl: text("source_url").notNull(),
    postedAt: text("posted_at"),
    deadlineAt: text("deadline_at"),
    firstSeenAt: text("first_seen_at").notNull(),
    lastSeenAt: text("last_seen_at").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    isNew: integer("is_new", { mode: "boolean" }).notNull().default(true),
  },
  (table) => [
    uniqueIndex("jobs_source_external").on(table.sourceId, table.externalId),
  ],
);

export const visits = sqliteTable(
  "visits",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    day: text("day").notNull(),
    visitor: text("visitor").notNull(),
    path: text("path").notNull(),
    jobFunction: text("job_function"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("visits_day_visitor_path").on(table.day, table.visitor, table.path)],
);

export const crawlRuns = sqliteTable("crawl_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at"),
  sourcesChecked: integer("sources_checked").notNull().default(0),
  jobsSeen: integer("jobs_seen").notNull().default(0),
  jobsNew: integer("jobs_new").notNull().default(0),
  status: text("status").notNull(),
  notes: text("notes"),
});

export const subscribers = sqliteTable("subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  studies: text("studies").notNull().default(""),
  cvText: text("cv_text").notNull().default(""),
  consentAt: text("consent_at").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const notifications = sqliteTable(
  "notifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    subscriberId: integer("subscriber_id").notNull(),
    jobId: integer("job_id").notNull(),
    status: text("status").notNull(),
    detail: text("detail"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [uniqueIndex("notifications_subscriber_job").on(table.subscriberId, table.jobId)],
);

export type JobRecord = typeof jobs.$inferSelect;
export type CrawlRunRecord = typeof crawlRuns.$inferSelect;
export type SubscriberRecord = typeof subscribers.$inferSelect;
