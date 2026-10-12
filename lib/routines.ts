import "server-only";

import { z } from "zod";
import { fail } from "@/lib/http";
import { authenticateBot, requireWrite, type BotsRepository } from "@/lib/publishing";
import { DEFAULT_ROUTINE_TZ, isValidCron } from "@/lib/routines-schedule";
import { isPreviewMode } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatZodError } from "@/lib/validations";
import type { Result } from "@/lib/types";

export const routineSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    schedule_text: z.string().trim().min(1).max(120),
    cron: z
      .string()
      .trim()
      .max(120)
      .refine((value) => !value || isValidCron(value), "cron inválido")
      .optional()
      .nullable(),
    timezone: z
      .string()
      .trim()
      .max(64)
      .refine((tz) => {
        try {
          new Intl.DateTimeFormat("es-AR", { timeZone: tz });
          return true;
        } catch {
          return false;
        }
      }, "timezone inválida")
      .optional()
      .nullable(),
    summary: z.string().trim().max(500).default(""),
    kind: z.string().trim().max(40).optional().nullable(),
    enabled: z.boolean().optional(),
  })
  .strict();

export const setRoutinesSchema = z
  .object({ routines: z.array(routineSchema).max(20) })
  .strict();

export type Routine = {
  id: string;
  bot_id: string;
  position: number;
  name: string;
  schedule_text: string;
  cron: string | null;
  timezone: string;
  summary: string;
  kind: string | null;
  enabled: boolean;
  updated_at: string;
};

const memory: Routine[] = [];

export async function listRoutines(botId?: string): Promise<Routine[]> {
  if (isPreviewMode()) return memory.filter((r) => !botId || r.bot_id === botId);
  let query = createAdminClient()
    .from("bot_routines")
    .select("*")
    .order("bot_id")
    .order("position");
  if (botId) query = query.eq("bot_id", botId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Routine[];
}

async function replaceRoutines(botId: string, rows: z.infer<typeof routineSchema>[]) {
  const now = new Date().toISOString();
  const mapped = rows.map((r, i) => ({
    bot_id: botId,
    position: i,
    name: r.name,
    schedule_text: r.schedule_text,
    cron: r.cron || null,
    timezone: r.timezone || DEFAULT_ROUTINE_TZ,
    summary: r.summary ?? "",
    kind: r.kind || null,
    enabled: r.enabled ?? true,
    updated_at: now,
  }));
  if (isPreviewMode()) {
    for (let i = memory.length - 1; i >= 0; i--) if (memory[i].bot_id === botId) memory.splice(i, 1);
    memory.push(...mapped.map((m) => ({ ...m, id: crypto.randomUUID() })));
    return;
  }
  const admin = createAdminClient();
  const del = await admin.from("bot_routines").delete().eq("bot_id", botId);
  if (del.error) throw del.error;
  if (mapped.length) {
    const ins = await admin.from("bot_routines").insert(mapped);
    if (ins.error) throw ins.error;
  }
}

export async function botGetRoutines(
  repo: BotsRepository,
  authorization: string | null,
): Promise<Result<{ routines: Routine[] }>> {
  const auth = await authenticateBot(repo, authorization);
  if (!auth.ok) return auth;
  return { ok: true, data: { routines: await listRoutines(auth.data.botId) } };
}

export async function botSetRoutines(
  repo: BotsRepository,
  authorization: string | null,
  payload: unknown,
): Promise<Result<{ routines: Routine[] }>> {
  const auth = await authenticateBot(repo, authorization);
  if (!auth.ok) return auth;
  const writer = requireWrite(auth.data);
  if (!writer.ok) return writer;
  const parsed = setRoutinesSchema.safeParse(payload ?? {});
  if (!parsed.success) {
    return fail(400, "invalid_input", "Rutinas inválidas", formatZodError(parsed.error));
  }
  await replaceRoutines(auth.data.botId, parsed.data.routines);
  return { ok: true, data: { routines: await listRoutines(auth.data.botId) } };
}
