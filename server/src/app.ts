import { existsSync } from "node:fs";
import path from "node:path";
import cors from "cors";
import express, {
  type ErrorRequestHandler,
  type Request,
  type Response,
} from "express";
import { ZodError } from "zod";
import { config } from "./config.js";
import { HttpError } from "./errors.js";
import { authRouter } from "./routes/auth.js";
import { applicationsRouter } from "./routes/applications.js";
import { statsRouter } from "./routes/stats.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
  });
  app.use(
    cors({
      origin: config.isProd ? true : config.webOrigin,
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/applications", applicationsRouter);
  app.use("/api/stats", statsRouter);

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Rota nao encontrada" });
  });

  // Em producao o proprio Express serve o build do Vite (deploy de um servico so).
  const webDist = path.resolve(process.cwd(), "..", "web", "dist");
  const indexHtml = path.join(webDist, "index.html");

  if (existsSync(indexHtml)) {
    app.use(express.static(webDist));
    app.use((req: Request, res: Response, next) => {
      if (req.method !== "GET") {
        next();
        return;
      }
      res.sendFile(indexHtml);
    });
  }

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "Dados invalidos", details: error.issues });
      return;
    }

    if (error instanceof HttpError) {
      res
        .status(error.status)
        .json({ error: error.message, details: error.details });
      return;
    }

    if (error instanceof SyntaxError && "body" in error) {
      res.status(400).json({ error: "JSON invalido no corpo da requisicao" });
      return;
    }

    console.error("[erro nao tratado]", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  };

  app.use(errorHandler);

  return app;
}
