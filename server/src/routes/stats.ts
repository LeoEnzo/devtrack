import { Router } from "express";
import { requireAuth } from "../auth.js";
import { getStats } from "../db.js";

export const statsRouter = Router();

statsRouter.use(requireAuth);

statsRouter.get("/", (req, res) => {
  res.json({ stats: getStats(req.userId!) });
});
