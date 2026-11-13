import { Router } from "express";
import { hashPassword, requireAuth, signToken, verifyPassword } from "../auth.js";
import { createUser, findUserByEmail, findUserById } from "../db.js";
import { conflict, notFound, unauthorized } from "../errors.js";
import { loginSchema, parseInput, registerSchema } from "../schemas.js";
import { toUser } from "../types.js";

export const authRouter = Router();

authRouter.post("/register", (req, res) => {
  const input = parseInput(registerSchema, req.body);

  if (findUserByEmail(input.email)) {
    throw conflict("Este e-mail ja esta cadastrado");
  }

  const user = createUser({
    name: input.name,
    email: input.email,
    passwordHash: hashPassword(input.password),
  });

  res.status(201).json({ token: signToken(user.id), user });
});

authRouter.post("/login", (req, res) => {
  const input = parseInput(loginSchema, req.body);
  const row = findUserByEmail(input.email);

  if (!row || !verifyPassword(input.password, row.password_hash)) {
    throw unauthorized("E-mail ou senha invalidos");
  }

  res.json({ token: signToken(row.id), user: toUser(row) });
});

authRouter.get("/me", requireAuth, (req, res) => {
  const row = findUserById(req.userId!);
  if (!row) throw notFound("Usuario nao encontrado");
  res.json({ user: toUser(row) });
});
