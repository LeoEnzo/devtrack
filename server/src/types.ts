export type Status =
  | "saved"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected";

export type Priority = "low" | "medium" | "high";
export type WorkMode = "remote" | "hybrid" | "onsite";
export type Source =
  | "linkedin"
  | "gupy"
  | "indeed"
  | "referral"
  | "company"
  | "other";

export const STATUSES: Status[] = [
  "saved",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
];
export const PRIORITIES: Priority[] = ["low", "medium", "high"];
export const WORK_MODES: WorkMode[] = ["remote", "hybrid", "onsite"];
export const SOURCES: Source[] = [
  "linkedin",
  "gupy",
  "indeed",
  "referral",
  "company",
  "other",
];

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  location: string;
  workMode: WorkMode;
  source: Source;
  status: Status;
  priority: Priority;
  salary: string;
  url: string;
  notes: string;
  appliedAt: string;
  nextStepAt: string | null;
  nextStepNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationRow {
  id: string;
  user_id: string;
  company: string;
  role: string;
  location: string;
  work_mode: WorkMode;
  source: Source;
  status: Status;
  priority: Priority;
  salary: string;
  url: string;
  notes: string;
  applied_at: string;
  next_step_at: string | null;
  next_step_note: string;
  created_at: string;
  updated_at: string;
}

export function toApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    location: row.location,
    workMode: row.work_mode,
    source: row.source,
    status: row.status,
    priority: row.priority,
    salary: row.salary,
    url: row.url,
    notes: row.notes,
    appliedAt: row.applied_at,
    nextStepAt: row.next_step_at,
    nextStepNote: row.next_step_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

export interface Stats {
  total: number;
  byStatus: Record<Status, number>;
  active: number;
  interviews: number;
  offers: number;
  responseRate: number;
  weekly: { weekStart: string; count: number }[];
  upcoming: Pick<
    Application,
    "id" | "company" | "role" | "status" | "nextStepAt" | "nextStepNote"
  >[];
  overdue: Pick<
    Application,
    "id" | "company" | "role" | "status" | "nextStepAt" | "nextStepNote"
  >[];
  topSources: { source: Source; count: number }[];
}
