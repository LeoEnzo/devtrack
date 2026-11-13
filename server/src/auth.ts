import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { unauthorized } from "./errors.js";

const KEY_LENGTH = 64;

/** Gera o hash no formato "scrypt:salt:hash" (salt aleatorio por usuario). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

/** Compara em tempo constante para evitar timing attacks. */
export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const expected = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, expected.length);

  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (typeof payload === "string" || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    next(unauthorized("Envie um token Bearer no cabecalho Authorization"));
    return;
  }

  const userId = verifyToken(token);
  if (!userId) {
    next(unauthorized("Token invalido ou expirado"));
    return;
  }

  req.userId = userId;
  next();
}
