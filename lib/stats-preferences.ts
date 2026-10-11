import "server-only";

import { isPreviewMode } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { mergeStatsLayout, type StatsLayout } from "@/lib/stats-layout";

const OWNER_ID = "owner";

let memory: StatsLayout | null = null;

export async function readStatsLayout(): Promise<StatsLayout> {
  if (isPreviewMode()) {
    return mergeStatsLayout(memory);
  }
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("owner_preferences")
    .select("stats_layout")
    .eq("id", OWNER_ID)
    .maybeSingle();
  if (error) throw error;
  return mergeStatsLayout(data?.stats_layout);
}

export async function writeStatsLayout(layout: StatsLayout): Promise<StatsLayout> {
  const next = mergeStatsLayout(layout);
  if (isPreviewMode()) {
    memory = next;
    return next;
  }
  const admin = createAdminClient();
  const { error } = await admin.from("owner_preferences").upsert({
    id: OWNER_ID,
    stats_layout: next,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return next;
}
