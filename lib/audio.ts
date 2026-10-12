import { randomUUID } from "node:crypto";
import { z } from "zod";
import { fail } from "@/lib/http";
import { formatZodError } from "@/lib/validations";
import { authenticateBot, requireWrite, type BotsRepository } from "@/lib/publishing";
import type { Result } from "@/lib/types";

export const AUDIO_BUCKET = "post-audio";
export const AUDIO_MAX_BYTES = 20 * 1024 * 1024;

export const AUDIO_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  opus: "audio/ogg",
  webm: "audio/webm",
};

const MIME_TO_EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/aac": "aac",
  "audio/ogg": "ogg",
  "audio/opus": "opus",
  "audio/webm": "webm",
};

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export type AudioStorage = {
  createSignedUploadUrl(path: string): Promise<{ signedUrl: string; token: string }>;
  upload(path: string, data: ArrayBuffer, contentType: string): Promise<void>;
  publicUrl(path: string): string;
  list(prefix: string): Promise<string[]>;
  remove(paths: string[]): Promise<number>;
};

function currentMonth(now = new Date()): string {
  // Hora Argentina (UTC-3).
  const ar = new Date(now.getTime() - 3 * 3600_000);
  return ar.toISOString().slice(0, 7);
}

export function resolveAudioExt(input: { ext?: string; filename?: string; content_type?: string }): string | null {
  const fromName = input.filename?.split(".").pop()?.toLowerCase();
  const candidates = [input.ext?.toLowerCase().replace(/^\./, ""), fromName];
  for (const c of candidates) if (c && AUDIO_TYPES[c]) return c;
  if (input.content_type && MIME_TO_EXT[input.content_type.toLowerCase()]) {
    return MIME_TO_EXT[input.content_type.toLowerCase()];
  }
  return null;
}

export function ownsAudioPath(slug: string, path: string): boolean {
  return /^[a-z0-9-]+\/\d{4}-\d{2}\/[A-Za-z0-9._-]+$/.test(path) && path.startsWith(`${slug}/`);
}

export const audioUploadSchema = z.object({
  filename: z.string().trim().max(200).optional(),
  ext: z.string().trim().max(8).optional(),
  content_type: z.string().trim().max(60).optional(),
});

export const audioDeleteSchema = z
  .object({
    path: z.string().trim().max(300).optional(),
    paths: z.array(z.string().trim().max(300)).max(200).optional(),
    month: z.string().regex(MONTH_RE, "Usá YYYY-MM").optional(),
  })
  .refine((v) => v.path || (v.paths && v.paths.length) || v.month, {
    message: "Mandá path, paths o month (YYYY-MM)",
  });

async function writer(repo: BotsRepository, authorization: string | null) {
  const auth = await authenticateBot(repo, authorization);
  if (!auth.ok) return auth;
  return requireWrite(auth.data);
}

function newPath(slug: string, ext: string) {
  return `${slug}/${currentMonth()}/${randomUUID()}.${ext}`;
}

export async function createAudioUploadUrl(
  repo: BotsRepository,
  storage: AudioStorage,
  authorization: string | null,
  payload: unknown,
): Promise<Result<Record<string, unknown>>> {
  const bot = await writer(repo, authorization);
  if (!bot.ok) return bot;
  const parsed = audioUploadSchema.safeParse(payload ?? {});
  if (!parsed.success) {
    return fail(400, "invalid_input", "Datos inválidos", formatZodError(parsed.error));
  }
  const ext = resolveAudioExt(parsed.data) ?? (parsed.data.ext || parsed.data.filename || parsed.data.content_type ? null : "mp3");
  if (!ext) return fail(400, "invalid_input", "Solo audio: mp3, m4a, aac, ogg, opus o webm");
  const path = newPath(bot.data.slug, ext);
  const signed = await storage.createSignedUploadUrl(path);
  return {
    ok: true,
    status: 201,
    data: {
      path,
      url: storage.publicUrl(path),
      upload_url: signed.signedUrl,
      token: signed.token,
      method: "PUT",
      content_type: AUDIO_TYPES[ext],
      max_bytes: AUDIO_MAX_BYTES,
      expires_in_seconds: 7200,
    },
  };
}

export async function uploadAudioFile(
  repo: BotsRepository,
  storage: AudioStorage,
  authorization: string | null,
  file: File,
): Promise<Result<Record<string, unknown>>> {
  const bot = await writer(repo, authorization);
  if (!bot.ok) return bot;
  const ext = resolveAudioExt({ filename: file.name, content_type: file.type });
  if (!ext) return fail(400, "invalid_input", "Solo audio: mp3, m4a, aac, ogg, opus o webm");
  if (file.size > AUDIO_MAX_BYTES) return fail(413, "too_large", "Máximo 20 MB");
  const path = newPath(bot.data.slug, ext);
  await storage.upload(path, await file.arrayBuffer(), AUDIO_TYPES[ext]);
  return { ok: true, status: 201, data: { path, url: storage.publicUrl(path), bytes: file.size } };
}

export async function deleteAudio(
  repo: BotsRepository,
  storage: AudioStorage,
  authorization: string | null,
  payload: unknown,
): Promise<Result<{ deleted: number; paths: string[] }>> {
  const bot = await writer(repo, authorization);
  if (!bot.ok) return bot;
  const parsed = audioDeleteSchema.safeParse(payload ?? {});
  if (!parsed.success) {
    return fail(400, "invalid_input", "Datos inválidos", formatZodError(parsed.error));
  }
  const slug = bot.data.slug;
  const requested = [
    ...(parsed.data.path ? [parsed.data.path] : []),
    ...(parsed.data.paths ?? []),
  ].map((p) => p.replace(/^.*\/post-audio\//, "").split("?")[0]);
  const foreign = requested.filter((p) => !ownsAudioPath(slug, p));
  if (foreign.length) {
    return fail(403, "forbidden", "Solo podés borrar audios propios", { paths: foreign });
  }
  let paths = requested;
  if (parsed.data.month) {
    const names = await storage.list(`${slug}/${parsed.data.month}`);
    paths = [...paths, ...names.map((n) => `${slug}/${parsed.data.month}/${n}`)];
  }
  const deleted = paths.length ? await storage.remove(paths) : 0;
  return { ok: true, data: { deleted, paths } };
}
