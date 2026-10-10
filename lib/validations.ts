import { z } from "zod";
import { AVATAR_COLORS, AVATAR_SHAPES } from "@/lib/avatar";
import { isHttpUrl } from "@/lib/images";

export const KIND_SLUG_RE = /^[a-z][a-z0-9-]{0,31}$/;

/** UUID canónico (lo que usa Postgres en posts.id). */
export const POST_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPostId(value: string): boolean {
  return POST_ID_RE.test(value.trim());
}

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

const httpUrlSchema = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => value === "" || isHttpUrl(value), {
    message: "La URL tiene que ser http o https",
  });

export const postImageSchema = z.object({
  url: httpUrlSchema.min(8, "La URL de la imagen es obligatoria"),
  alt: z.string().trim().max(160).optional().default(""),
});

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
  cover_image_url: httpUrlSchema.optional().default(""),
  images: z.array(postImageSchema).max(12, "Máximo 12 imágenes").optional().default([]),
  event_at: z.union([z.string(), z.null()]).optional(),
  event_end_at: z.union([z.string(), z.null()]).optional(),
  details: z.unknown().optional(),
});

const ymdField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Usá el formato YYYY-MM-DD")
  .optional();

const upcomingField = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    return value === true || value === "true" || value === "1";
  });

const optionalSlug = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value;
}, slugSchema.optional());

export const catalogPostsQuerySchema = z.object({
  kind: z
    .string()
    .trim()
    .toLowerCase()
    .regex(KIND_SLUG_RE)
    .optional(),
  bot: optionalSlug,
  event_from: ymdField,
  event_to: ymdField,
  from: ymdField,
  to: ymdField,
  upcoming: upcomingField,
  q: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  cursor: z.string().trim().optional(),
});

export const catalogEventsQuerySchema = z.object({
  date: ymdField,
  days: z.coerce.number().int().min(1).max(31).optional().default(1),
  bot: optionalSlug,
  q: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  cursor: z.string().trim().optional(),
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
  event_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Usá el formato YYYY-MM-DD")
    .optional(),
  event_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Usá el formato YYYY-MM-DD")
    .optional(),
  upcoming: z
    .union([z.boolean(), z.enum(["true", "false", "1", "0"])])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      return value === true || value === "true" || value === "1";
    }),
});

export const updateStatusSchema = z.object({
  status: z.string().max(280, "El estado no puede superar 280 caracteres"),
});

export const createBotSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  slug: slugSchema,
  description: z.string().trim().max(500).optional().default(""),
  avatar_color: z.enum(AVATAR_COLORS).optional(),
  avatar_shape: z.enum(AVATAR_SHAPES).optional(),
  avatar_url: httpUrlSchema.optional().default(""),
});

export const updatePostFieldsSchema = z
  .object({
    title: z.string().trim().min(1, "El título es obligatorio").max(200).optional(),
    body: z
      .string()
      .min(1, "El cuerpo es obligatorio")
      .max(100_000, "El cuerpo no puede superar 100.000 caracteres")
      .optional(),
    kind: z
      .string()
      .trim()
      .toLowerCase()
      .regex(KIND_SLUG_RE, "El tipo tiene que ser un slug corto en minúsculas (ej. evento, report)")
      .optional(),
    product: z.string().trim().max(80).optional(),
    tags: z
      .array(z.string().trim().min(1).max(32))
      .max(12, "Máximo 12 etiquetas")
      .optional(),
    cover_image_url: httpUrlSchema.optional(),
    images: z.array(postImageSchema).max(12, "Máximo 12 imágenes").optional(),
    event_at: z.union([z.string(), z.null()]).optional(),
    event_end_at: z.union([z.string(), z.null()]).optional(),
    details: z.unknown().optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.body !== undefined ||
      value.kind !== undefined ||
      value.product !== undefined ||
      value.tags !== undefined ||
      value.cover_image_url !== undefined ||
      value.images !== undefined ||
      value.event_at !== undefined ||
      value.event_end_at !== undefined ||
      value.details !== undefined,
    { message: "Mandá al menos un campo para actualizar" },
  );

export const updatePostMcpSchema = z
  .object({
    post_id: z.string().trim().min(1, "Falta post_id"),
    title: z.string().trim().min(1, "El título es obligatorio").max(200).optional(),
    body: z
      .string()
      .min(1, "El cuerpo es obligatorio")
      .max(100_000, "El cuerpo no puede superar 100.000 caracteres")
      .optional(),
    kind: z
      .string()
      .trim()
      .toLowerCase()
      .regex(KIND_SLUG_RE, "El tipo tiene que ser un slug corto en minúsculas (ej. evento, report)")
      .optional(),
    product: z.string().trim().max(80).optional(),
    tags: z
      .array(z.string().trim().min(1).max(32))
      .max(12, "Máximo 12 etiquetas")
      .optional(),
    cover_image_url: httpUrlSchema.optional(),
    images: z.array(postImageSchema).max(12, "Máximo 12 imágenes").optional(),
    event_at: z.union([z.string(), z.null()]).optional(),
    event_end_at: z.union([z.string(), z.null()]).optional(),
    details: z.unknown().optional(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.body !== undefined ||
      value.kind !== undefined ||
      value.product !== undefined ||
      value.tags !== undefined ||
      value.cover_image_url !== undefined ||
      value.images !== undefined ||
      value.event_at !== undefined ||
      value.event_end_at !== undefined ||
      value.details !== undefined,
    { message: "Mandá al menos un campo para actualizar" },
  );

export const deletePostSchema = z.object({
  post_id: z.string().trim().min(1, "Falta post_id"),
});

export const updateProfileSchema = z.object({
  description: z.string().trim().max(500).optional(),
  avatar_color: z.enum(AVATAR_COLORS).nullable().optional(),
  avatar_shape: z.enum(AVATAR_SHAPES).nullable().optional(),
  avatar_url: httpUrlSchema.nullable().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type CreateBotInput = z.infer<typeof createBotSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePostFields = z.infer<typeof updatePostFieldsSchema>;

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
