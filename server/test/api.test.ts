import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";

const dbPath = path.join(os.tmpdir(), `devtrack-test-${randomUUID()}.db`);
process.env.DB_PATH = dbPath;
process.env.JWT_SECRET = "test-secret";

const { createApp } = await import("../src/app.js");
const { db } = await import("../src/db.js");

const server = createApp().listen(0);
await new Promise<void>((resolve) => server.once("listening", resolve));
const { port } = server.address() as AddressInfo;
const base = `http://127.0.0.1:${port}/api`;

let token = "";
let applicationId = "";

after(() => {
  server.close();
  db.close();
  for (const suffix of ["", "-wal", "-shm"]) {
    try {
      rmSync(`${dbPath}${suffix}`, { force: true });
    } catch {
      // Windows pode manter o arquivo travado por alguns instantes; o lixo
      // fica na pasta temporaria e nao afeta os testes.
    }
  }
});

async function api(
  route: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
) {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${base}${route}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await response.text();
  return {
    status: response.status,
    body: text ? (JSON.parse(text) as Record<string, any>) : null,
  };
}

test("health check responde ok", async () => {
  const response = await api("/health", { auth: false });
  assert.equal(response.status, 200);
  assert.equal(response.body?.status, "ok");
});

test("cadastro cria usuario e devolve token", async () => {
  const response = await api("/auth/register", {
    method: "POST",
    auth: false,
    body: {
      name: "Maria Silva",
      email: "maria@teste.dev",
      password: "senha-segura-123",
    },
  });

  assert.equal(response.status, 201);
  assert.equal(typeof response.body?.token, "string");
  assert.equal(response.body?.user.email, "maria@teste.dev");
  assert.equal(response.body?.user.password_hash, undefined);

  token = response.body!.token;
});

test("nao permite e-mail duplicado", async () => {
  const response = await api("/auth/register", {
    method: "POST",
    auth: false,
    body: {
      name: "Outra Maria",
      email: "maria@teste.dev",
      password: "outra-senha-123",
    },
  });

  assert.equal(response.status, 409);
});

test("valida dados de cadastro", async () => {
  const response = await api("/auth/register", {
    method: "POST",
    auth: false,
    body: { name: "A", email: "invalido", password: "123" },
  });

  assert.equal(response.status, 400);
  assert.ok(Array.isArray(response.body?.details));
});

test("login rejeita senha errada", async () => {
  const response = await api("/auth/login", {
    method: "POST",
    auth: false,
    body: { email: "maria@teste.dev", password: "senha-errada" },
  });

  assert.equal(response.status, 401);
});

test("login autentica com credenciais validas", async () => {
  const response = await api("/auth/login", {
    method: "POST",
    auth: false,
    body: { email: "maria@teste.dev", password: "senha-segura-123" },
  });

  assert.equal(response.status, 200);
  assert.equal(typeof response.body?.token, "string");
});

test("rotas protegidas exigem token", async () => {
  const response = await api("/applications", { auth: false });
  assert.equal(response.status, 401);
});

test("cria candidatura com valores padrao", async () => {
  const response = await api("/applications", {
    method: "POST",
    body: { company: "Acme", role: "Dev Front-end" },
  });

  assert.equal(response.status, 201);
  assert.equal(response.body?.application.company, "Acme");
  assert.equal(response.body?.application.status, "applied");
  assert.equal(response.body?.application.priority, "medium");

  applicationId = response.body!.application.id;
});

test("rejeita candidatura sem empresa", async () => {
  const response = await api("/applications", {
    method: "POST",
    body: { role: "Dev" },
  });

  assert.equal(response.status, 400);
});

test("lista e filtra candidaturas", async () => {
  const all = await api("/applications");
  assert.equal(all.status, 200);
  assert.equal(all.body?.applications.length, 1);

  const filtered = await api("/applications?status=interview");
  assert.equal(filtered.body?.applications.length, 0);

  const search = await api("/applications?q=acme");
  assert.equal(search.body?.applications.length, 1);
});

test("atualiza status da candidatura", async () => {
  const response = await api(`/applications/${applicationId}`, {
    method: "PATCH",
    body: { status: "interview", nextStepNote: "Entrevista marcada" },
  });

  assert.equal(response.status, 200);
  assert.equal(response.body?.application.status, "interview");
});

test("usuario nao acessa candidatura de outro", async () => {
  const other = await api("/auth/register", {
    method: "POST",
    auth: false,
    body: {
      name: "Joao Souza",
      email: "joao@teste.dev",
      password: "outra-senha-123",
    },
  });

  const response = await fetch(`${base}/applications/${applicationId}`, {
    headers: { Authorization: `Bearer ${other.body!.token}` },
  });

  assert.equal(response.status, 404);

  const list = await fetch(`${base}/applications`, {
    headers: { Authorization: `Bearer ${other.body!.token}` },
  });
  const body = (await list.json()) as { applications: unknown[] };
  assert.equal(body.applications.length, 0);
});

test("estatisticas refletem os dados", async () => {
  const response = await api("/stats");
  assert.equal(response.status, 200);
  assert.equal(response.body?.stats.total, 1);
  assert.equal(response.body?.stats.interviews, 1);
  assert.equal(response.body?.stats.responseRate, 100);
});

test("remove candidatura", async () => {
  const response = await api(`/applications/${applicationId}`, {
    method: "DELETE",
  });
  assert.equal(response.status, 204);

  const list = await api("/applications");
  assert.equal(list.body?.applications.length, 0);
});
