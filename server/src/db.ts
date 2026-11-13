import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { config } from "./config.js";
import {
  type Application,
  type ApplicationRow,
  type Priority,
  type Source,
  type Stats,
  type Status,
  type User,
  type UserRow,
  STATUSES,
  toApplication,
  toUser,
} from "./types.js";

mkdirSync(path.dirname(config.dbPath), { recursive: true });

export const db = new DatabaseSync(config.dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS applications (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company        TEXT NOT NULL,
    role           TEXT NOT NULL,
    location       TEXT NOT NULL DEFAULT '',
    work_mode      TEXT NOT NULL DEFAULT 'remote',
    source         TEXT NOT NULL DEFAULT 'other',
    status         TEXT NOT NULL DEFAULT 'applied',
    priority       TEXT NOT NULL DEFAULT 'medium',
    salary         TEXT NOT NULL DEFAULT '',
    url            TEXT NOT NULL DEFAULT '',
    notes          TEXT NOT NULL DEFAULT '',
    applied_at     TEXT NOT NULL,
    next_step_at   TEXT,
    next_step_note TEXT NOT NULL DEFAULT '',
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_applications_user
    ON applications(user_id, status);
`);

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function nowIso() {
  return new Date().toISOString();
}

export function todayLocal() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export function findUserByEmail(email: string): UserRow | undefined {
  const row = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email.toLowerCase()) as UserRow | undefined;
  return row;
}

export function findUserById(id: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | UserRow
    | undefined;
}

export function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): User {
  const id = randomUUID();
  const createdAt = nowIso();

  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, input.name, input.email.toLowerCase(), input.passwordHash, createdAt);

  return {
    id,
    name: input.name,
    email: input.email.toLowerCase(),
    createdAt,
  };
}

/* ------------------------------------------------------------------ */
/* Applications                                                        */
/* ------------------------------------------------------------------ */

export interface ApplicationInput {
  company: string;
  role: string;
  location?: string;
  workMode?: string;
  source?: string;
  status?: string;
  priority?: string;
  salary?: string;
  url?: string;
  notes?: string;
  appliedAt?: string;
  nextStepAt?: string | null;
  nextStepNote?: string;
}

export interface ListFilters {
  status?: string;
  q?: string;
  sort?: string;
}

const SORT_SQL: Record<string, string> = {
  recent: "applied_at DESC, created_at DESC",
  oldest: "applied_at ASC, created_at ASC",
  company: "company COLLATE NOCASE ASC",
  priority: `CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END ASC,
             applied_at DESC`,
};

export function listApplications(
  userId: string,
  filters: ListFilters = {},
): Application[] {
  let sql = "SELECT * FROM applications WHERE user_id = ?";
  const params: string[] = [userId];

  if (filters.status && STATUSES.includes(filters.status as Status)) {
    sql += " AND status = ?";
    params.push(filters.status);
  }

  if (filters.q) {
    sql += " AND (company LIKE ? OR role LIKE ? OR notes LIKE ?)";
    const term = `%${filters.q}%`;
    params.push(term, term, term);
  }

  const sort = SORT_SQL[filters.sort ?? "recent"] ?? SORT_SQL.recent;
  sql += ` ORDER BY ${sort}`;

  const rows = db.prepare(sql).all(...params) as unknown as ApplicationRow[];
  return rows.map(toApplication);
}

export function getApplication(
  userId: string,
  id: string,
): Application | undefined {
  const row = db
    .prepare("SELECT * FROM applications WHERE id = ? AND user_id = ?")
    .get(id, userId) as ApplicationRow | undefined;
  return row ? toApplication(row) : undefined;
}

export function createApplication(
  userId: string,
  input: ApplicationInput,
): Application {
  const id = randomUUID();
  const timestamp = nowIso();

  db.prepare(
    `INSERT INTO applications
      (id, user_id, company, role, location, work_mode, source, status, priority,
       salary, url, notes, applied_at, next_step_at, next_step_note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    userId,
    input.company,
    input.role,
    input.location ?? "",
    input.workMode ?? "remote",
    input.source ?? "other",
    input.status ?? "applied",
    input.priority ?? "medium",
    input.salary ?? "",
    input.url ?? "",
    input.notes ?? "",
    input.appliedAt ?? todayLocal(),
    input.nextStepAt ?? null,
    input.nextStepNote ?? "",
    timestamp,
    timestamp,
  );

  const created = db
    .prepare("SELECT * FROM applications WHERE id = ?")
    .get(id) as unknown as ApplicationRow;
  return toApplication(created);
}

const UPDATABLE: Record<string, string> = {
  company: "company",
  role: "role",
  location: "location",
  workMode: "work_mode",
  source: "source",
  status: "status",
  priority: "priority",
  salary: "salary",
  url: "url",
  notes: "notes",
  appliedAt: "applied_at",
  nextStepAt: "next_step_at",
  nextStepNote: "next_step_note",
};

export function updateApplication(
  userId: string,
  id: string,
  patch: Partial<ApplicationInput>,
): Application | undefined {
  const sets: string[] = [];
  const values: (string | null)[] = [];

  for (const [key, column] of Object.entries(UPDATABLE)) {
    const value = patch[key as keyof ApplicationInput];
    if (value === undefined) continue;
    sets.push(`${column} = ?`);
    values.push(value === "" && key === "nextStepAt" ? null : value);
  }

  if (sets.length === 0) return getApplication(userId, id);

  sets.push("updated_at = ?");
  values.push(nowIso());

  db.prepare(
    `UPDATE applications SET ${sets.join(", ")}
     WHERE id = ? AND user_id = ?`,
  ).run(...values, id, userId);

  return getApplication(userId, id);
}

export function deleteApplication(userId: string, id: string): boolean {
  const result = db
    .prepare("DELETE FROM applications WHERE id = ? AND user_id = ?")
    .run(id, userId);
  return Number(result.changes) > 0;
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

function mondayOf(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay(); // 0 = domingo
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function getStats(userId: string): Stats {
  const rows = db
    .prepare("SELECT * FROM applications WHERE user_id = ?")
    .all(userId) as unknown as ApplicationRow[];
  const applications = rows.map(toApplication);

  const byStatus = Object.fromEntries(
    STATUSES.map((status) => [status, 0]),
  ) as Record<Status, number>;

  for (const application of applications) {
    byStatus[application.status] += 1;
  }

  const total = applications.length;
  const active = byStatus.applied + byStatus.screening + byStatus.interview;
  const responded =
    byStatus.screening + byStatus.interview + byStatus.offer + byStatus.rejected;
  const sent = total - byStatus.saved;

  const weekly: { weekStart: string; count: number }[] = [];
  const currentMonday = mondayOf(new Date());
  for (let index = 7; index >= 0; index -= 1) {
    const start = new Date(currentMonday);
    start.setDate(start.getDate() - index * 7);
    weekly.push({ weekStart: isoDate(start), count: 0 });
  }

  for (const application of applications) {
    const parsed = new Date(`${application.appliedAt}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) continue;
    const bucket = isoDate(mondayOf(parsed));
    const entry = weekly.find((item) => item.weekStart === bucket);
    if (entry) entry.count += 1;
  }

  const today = todayLocal();
  const withNextStep = applications.filter(
    (item): item is Application & { nextStepAt: string } =>
      item.nextStepAt !== null &&
      item.status !== "rejected" &&
      item.status !== "offer",
  );

  const pick = (item: Application & { nextStepAt: string }) => ({
    id: item.id,
    company: item.company,
    role: item.role,
    status: item.status,
    nextStepAt: item.nextStepAt,
    nextStepNote: item.nextStepNote,
  });

  const upcoming = withNextStep
    .filter((item) => item.nextStepAt >= today)
    .sort((a, b) => a.nextStepAt.localeCompare(b.nextStepAt))
    .slice(0, 5)
    .map(pick);

  const overdue = withNextStep
    .filter((item) => item.nextStepAt < today)
    .sort((a, b) => a.nextStepAt.localeCompare(b.nextStepAt))
    .slice(0, 5)
    .map(pick);

  const sourceCount = new Map<Source, number>();
  for (const application of applications) {
    sourceCount.set(application.source, (sourceCount.get(application.source) ?? 0) + 1);
  }
  const topSources = [...sourceCount.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return {
    total,
    byStatus,
    active,
    interviews: byStatus.interview,
    offers: byStatus.offer,
    responseRate: sent > 0 ? Math.round((responded / sent) * 100) : 0,
    weekly,
    upcoming,
    overdue,
    topSources,
  };
}
