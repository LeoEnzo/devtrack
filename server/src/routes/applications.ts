import { Router } from "express";
import { requireAuth } from "../auth.js";
import {
  createApplication,
  deleteApplication,
  getApplication,
  listApplications,
  updateApplication,
} from "../db.js";
import { notFound } from "../errors.js";
import { applicationPatchSchema, applicationSchema, parseInput } from "../schemas.js";

export const applicationsRouter = Router();

applicationsRouter.use(requireAuth);

applicationsRouter.get("/", (req, res) => {
  const { status, q, sort } = req.query;
  const applications = listApplications(req.userId!, {
    status: typeof status === "string" ? status : undefined,
    q: typeof q === "string" && q.trim() !== "" ? q.trim() : undefined,
    sort: typeof sort === "string" ? sort : undefined,
  });
  res.json({ applications });
});

applicationsRouter.get("/:id", (req, res) => {
  const application = getApplication(req.userId!, String(req.params.id));
  if (!application) throw notFound("Candidatura nao encontrada");
  res.json({ application });
});

applicationsRouter.post("/", (req, res) => {
  const input = parseInput(applicationSchema, req.body);
  const application = createApplication(req.userId!, input);
  res.status(201).json({ application });
});

applicationsRouter.patch("/:id", (req, res) => {
  const patch = parseInput(applicationPatchSchema, req.body);
  const application = updateApplication(req.userId!, String(req.params.id), patch);
  if (!application) throw notFound("Candidatura nao encontrada");
  res.json({ application });
});

applicationsRouter.delete("/:id", (req, res) => {
  const deleted = deleteApplication(req.userId!, String(req.params.id));
  if (!deleted) throw notFound("Candidatura nao encontrada");
  res.status(204).end();
});
