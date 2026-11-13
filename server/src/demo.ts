import { hashPassword } from "./auth.js";
import {
  createApplication,
  createUser,
  db,
  findUserByEmail,
} from "./db.js";

export const DEMO_EMAIL = "demo@devtrack.dev";
export const DEMO_PASSWORD = "devtrack123";

function dateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const demoApplications = [
  {
    company: "Nubank",
    role: "Desenvolvedor Front-end Junior",
    location: "Remoto",
    workMode: "remote",
    source: "linkedin",
    status: "interview",
    priority: "high",
    salary: "R$ 6.000 - R$ 8.000",
    appliedAt: dateOffset(-9),
    nextStepAt: dateOffset(2),
    nextStepNote: "Entrevista técnica com o time de produto",
  },
  {
    company: "iFood",
    role: "Backend Node.js Júnior",
    location: "Osasco, SP",
    workMode: "hybrid",
    source: "gupy",
    status: "screening",
    priority: "high",
    salary: "R$ 5.500",
    appliedAt: dateOffset(-5),
    nextStepAt: dateOffset(4),
    nextStepNote: "Conversa com recrutadora",
  },
  {
    company: "Stone",
    role: "Desenvolvedor Full Stack",
    location: "São Paulo, SP",
    workMode: "onsite",
    source: "referral",
    status: "applied",
    priority: "high",
    salary: "",
    appliedAt: dateOffset(-9),
    nextStepAt: dateOffset(-1),
    nextStepNote: "Enviar o teste técnico (prazo venceu!)",
  },
  {
    company: "Mercado Livre",
    role: "Front-end React Júnior",
    location: "Remoto",
    workMode: "remote",
    source: "linkedin",
    status: "rejected",
    priority: "medium",
    appliedAt: dateOffset(-20),
    notes: "Feedback: buscavam alguém com mais experiência em testes E2E.",
  },
  {
    company: "Loft",
    role: "Desenvolvedor Backend",
    location: "São Paulo, SP",
    workMode: "hybrid",
    source: "company",
    status: "offer",
    priority: "high",
    salary: "R$ 7.000",
    appliedAt: dateOffset(-26),
    nextStepAt: dateOffset(3),
    nextStepNote: "Responder a proposta até sexta",
  },
  {
    company: "VTEX",
    role: "Front-end Developer",
    location: "Remoto",
    workMode: "remote",
    source: "gupy",
    status: "applied",
    priority: "medium",
    appliedAt: dateOffset(-3),
  },
  {
    company: "CloudWalk",
    role: "Backend Engineer Júnior",
    location: "São Paulo, SP",
    workMode: "onsite",
    source: "linkedin",
    status: "screening",
    priority: "medium",
    appliedAt: dateOffset(-7),
    nextStepAt: dateOffset(6),
    nextStepNote: "Desafio de código no HackerRank",
  },
  {
    company: "Hotmart",
    role: "Full Stack Developer",
    location: "Remoto",
    workMode: "remote",
    source: "referral",
    status: "interview",
    priority: "high",
    appliedAt: dateOffset(-12),
    nextStepAt: dateOffset(1),
    nextStepNote: "Entrevista com a liderança técnica",
  },
  {
    company: "QuintoAndar",
    role: "Front-end Engineer",
    location: "Remoto",
    workMode: "hybrid",
    source: "company",
    status: "applied",
    priority: "medium",
    appliedAt: dateOffset(-1),
  },
  {
    company: "Rappi",
    role: "Front-end Developer",
    location: "Remoto",
    workMode: "remote",
    source: "linkedin",
    status: "applied",
    priority: "low",
    appliedAt: dateOffset(-6),
  },
  {
    company: "CI&T",
    role: "Desenvolvedor Full Stack Júnior",
    location: "Campinas, SP",
    workMode: "hybrid",
    source: "gupy",
    status: "rejected",
    priority: "low",
    appliedAt: dateOffset(-17),
  },
  {
    company: "PicPay",
    role: "Front-end React",
    location: "São Paulo, SP",
    workMode: "onsite",
    source: "linkedin",
    status: "interview",
    priority: "high",
    appliedAt: dateOffset(-14),
    nextStepAt: dateOffset(2),
    nextStepNote: "Pair programming com o time",
  },
  {
    company: "Neon",
    role: "Backend Node.js",
    location: "Remoto",
    workMode: "remote",
    source: "company",
    status: "applied",
    priority: "medium",
    appliedAt: dateOffset(-4),
  },
  {
    company: "Wildlife Studios",
    role: "Backend Developer",
    location: "São Paulo, SP",
    workMode: "onsite",
    source: "other",
    status: "saved",
    priority: "low",
    appliedAt: dateOffset(-1),
  },
  {
    company: "Banco Inter",
    role: "Desenvolvedor Front-end",
    location: "Belo Horizonte, MG",
    workMode: "hybrid",
    source: "gupy",
    status: "saved",
    priority: "medium",
    appliedAt: dateOffset(-2),
  },
];

/**
 * Cria (ou recria) o usuario demo com dados de exemplo.
 * Usado pelo script `npm run seed` e no boot quando o banco esta vazio.
 */
export function seedDemo({ reset = false } = {}) {
  const existing = findUserByEmail(DEMO_EMAIL);

  if (existing && !reset) {
    return { created: false, count: 0 };
  }

  if (existing) {
    db.prepare("DELETE FROM applications WHERE user_id = ?").run(existing.id);
  }

  const user =
    existing ??
    createUser({
      name: "Dev Demo",
      email: DEMO_EMAIL,
      passwordHash: hashPassword(DEMO_PASSWORD),
    });

  for (const application of demoApplications) {
    createApplication(user.id, application);
  }

  return { created: true, count: demoApplications.length };
}

/** Popula o banco somente se ainda nao existir nenhum usuario. */
export function autoSeedIfEmpty() {
  const row = db
    .prepare("SELECT COUNT(*) AS count FROM users")
    .get() as unknown as { count: number };

  if (row.count > 0) return;

  seedDemo();
  console.log("Banco vazio: conta demo criada automaticamente.");
}

