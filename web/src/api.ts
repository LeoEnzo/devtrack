import type {
  Application,
  Priority,
  Source,
  Stats,
  Status,
  User,
  WorkMode,
} from "./types";

const TOKEN_KEY = "devtrack.token";
const BASE = import.meta.env.VITE_API_URL ?? "/api";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function readToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function storeToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = readToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      0,
      "Não foi possível falar com o servidor. Ele está rodando?",
    );
  }

  if (response.status === 204) return undefined as T;

  const data = (await response.json().catch(() => null)) as {
    error?: string;
    details?: unknown;
  } | null;

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.error ?? `Erro inesperado (${response.status})`,
      data?.details,
    );
  }

  return data as T;
}

export type ApplicationPayload = {
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
};

export const api = {
  async register(name: string, email: string, password: string) {
    const data = await request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    storeToken(data.token);
    return data.user;
  },

  async login(email: string, password: string) {
    const data = await request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    storeToken(data.token);
    return data.user;
  },

  async me() {
    const data = await request<{ user: User }>("/auth/me");
    return data.user;
  },

  logout() {
    storeToken(null);
  },

  async listApplications() {
    const data = await request<{ applications: Application[] }>("/applications");
    return data.applications;
  },

  async createApplication(payload: ApplicationPayload) {
    const data = await request<{ application: Application }>("/applications", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data.application;
  },

  async updateApplication(id: string, patch: Partial<ApplicationPayload>) {
    const data = await request<{ application: Application }>(
      `/applications/${id}`,
      { method: "PATCH", body: JSON.stringify(patch) },
    );
    return data.application;
  },

  async deleteApplication(id: string) {
    await request<void>(`/applications/${id}`, { method: "DELETE" });
  },

  async stats() {
    const data = await request<{ stats: Stats }>("/stats");
    return data.stats;
  },
};
