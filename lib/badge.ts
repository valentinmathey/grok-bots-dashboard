import "server-only";

import { isPreviewMode } from "@/lib/env";
import { DEFAULT_LOOKBACK_MS } from "@/lib/last-seen";
import { getPrefs } from "@/lib/push-store";
import { isBotEnabled } from "@/lib/push-types";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Novedades sin ver para el ícono: posts desde la última vez que se abrió el
 * Resumen del día (cookie de visita), solo de bots con notificaciones prendidas.
 */
export async function countUnseen(visitAt: string | null, now = new Date()): Promise<number> {
  if (isPreviewMode()) return 0;
  const parsed = visitAt ? Date.parse(visitAt) : NaN;
  const since = new Date(Number.isFinite(parsed) ? parsed : now.getTime() - DEFAULT_LOOKBACK_MS).toISOString();
  const [prefs, result] = await Promise.all([
    getPrefs(),
    createAdminClient().from("posts").select("bot_id").gt("created_at", since).limit(500),
  ]);
  if (result.error) throw result.error;
  return (result.data ?? []).filter((row) => isBotEnabled(prefs, String(row.bot_id))).length;
}
