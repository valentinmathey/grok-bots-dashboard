import { z } from "zod";

export const KIND_SLUG_RE = /^[a-z][a-z0-9-]{0,31}$/;

export const postKindSchema = z.preprocess((value) => {
  if (value == null || value === "") {
    return "update";
  }
  return String(value).trim().toLowerCase();
}, z.string().regex(KIND_SLUG_RE, "El tipo tiene que ser un slug corto en minúsculas (ej. evento, report)"));

export const slugSchema = z
  .string()
  .trim()
  .min(2, "El slug tiene que tener al menos 2 caracteres")
  .max(64, "El slug no puede superar 64 caracteres")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Usá solo minúsculas, números y guiones (sin guión al inicio o al final)",
  );

export const createPostSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  body: z
    .string()
    .min(1, "El cuerpo es obligatorio")
    .max(100_000, "El cuerpo no puede superar 100.000 caracteres"),
  kind: postKindSchema.optional().default("update"),
  product: z.string().trim().max(80).optional().default(""),
  tags: z
    .array(z.string().trim().min(1).max(32))
    .max(12, "Máximo 12 etiquetas")
    .optional()
    .default([]),
});

export const listPostsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  product: z.string().trim().max(80).optional(),
  kind: z
    .string()
    .trim()
    .toLowerCase()
    .regex(KIND_SLUG_RE)
    .optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Usá el formato YYYY-MM-DD")
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Usá el formato YYYY-MM-DD")
    .optional(),
  tag: z.string().trim().max(32).optional(),
});

export const updateStatusSchema = z.object({
  status: z.string().max(280, "El estado no puede superar 280 caracteres"),
});

export const createBotSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  slug: slugSchema,
  description: z.string().trim().max(500).optional().default(""),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type CreateBotInput = z.infer<typeof createBotSchema>;

export function isKindSlug(value: string): boolean {
  return KIND_SLUG_RE.test(value);
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const tag = raw.replace(/^#/, "").trim().toLowerCase();
    if (!tag || seen.has(tag)) {
      continue;
    }
    seen.add(tag);
    result.push(tag);
  }
  return result;
}

export function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join(".") : "(root)",
    message: issue.message,
  }));
}
