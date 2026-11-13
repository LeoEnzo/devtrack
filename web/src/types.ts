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

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
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

export type NextStep = Pick<
  Application,
  "id" | "company" | "role" | "status" | "nextStepAt" | "nextStepNote"
>;

export interface Stats {
  total: number;
  byStatus: Record<Status, number>;
  active: number;
  interviews: number;
  offers: number;
  responseRate: number;
  weekly: { weekStart: string; count: number }[];
  upcoming: NextStep[];
  overdue: NextStep[];
  topSources: { source: Source; count: number }[];
}

export const STATUS_ORDER: Status[] = [
  "saved",
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
];

export const STATUS_LABELS: Record<Status, string> = {
  saved: "Salvas",
  applied: "Aplicadas",
  screening: "Triagem",
  interview: "Entrevistas",
  offer: "Ofertas",
  rejected: "Recusadas",
};

export const STATUS_SHORT: Record<Status, string> = {
  saved: "Salva",
  applied: "Aplicada",
  screening: "Triagem",
  interview: "Entrevista",
  offer: "Oferta",
  rejected: "Recusada",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remoto",
  hybrid: "Híbrido",
  onsite: "Presencial",
};

export const SOURCE_LABELS: Record<Source, string> = {
  linkedin: "LinkedIn",
  gupy: "Gupy",
  indeed: "Indeed",
  referral: "Indicação",
  company: "Site da empresa",
  other: "Outro",
};
