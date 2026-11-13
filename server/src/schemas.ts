import { z } from "zod";
import { badRequest } from "./errors.js";

const password = z
  .string()
  .min(8, "A senha precisa ter no minimo 8 caracteres")
  .max(72, "A senha pode ter no maximo 72 caracteres");

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome")
    .max(80, "Nome muito longo"),
  email: z.email("Informe um e-mail valido").toLowerCase(),
  password,
});

export const loginSchema = z.object({
  email: z.email("Informe um e-mail valido").toLowerCase(),
  password: z.string().min(1, "Informe a senha"),
});

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD");

export const applicationSchema = z.object({
  company: z.string().trim().min(1, "Informe a empresa").max(120),
  role: z.string().trim().min(1, "Informe o cargo").max(120),
  location: z.string().trim().max(120).optional(),
  workMode: z.enum(["remote", "hybrid", "onsite"]).optional(),
  source: z
    .enum(["linkedin", "gupy", "indeed", "referral", "company", "other"])
    .optional(),
  status: z
    .enum(["saved", "applied", "screening", "interview", "offer", "rejected"])
    .optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  salary: z.string().trim().max(60).optional(),
  url: z.union([z.literal(""), z.url("Informe uma URL valida").max(500)]).optional(),
  notes: z.string().max(5000).optional(),
  appliedAt: dateString.optional(),
  nextStepAt: z.union([z.literal(""), z.null(), dateString]).optional(),
  nextStepNote: z.string().trim().max(500).optional(),
});

export const applicationPatchSchema = applicationSchema.partial();

export function parseInput<T extends z.ZodType>(
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw badRequest(
      "Dados invalidos",
      result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
  }
  return result.data;
}
