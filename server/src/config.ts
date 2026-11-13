import path from "node:path";

const isProd = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET ?? "";

if (isProd && !jwtSecret) {
  throw new Error("JWT_SECRET e obrigatorio em producao.");
}

export const config = {
  isProd,
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: jwtSecret || "dev-secret-nao-use-em-producao",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  dbPath: process.env.DB_PATH ?? path.join(process.cwd(), "data", "devtrack.db"),
};
