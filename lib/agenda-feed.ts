import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { isPreviewMode } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

const memory: { hash: string; prefix: string; revoked: boolean }[] = [];

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createAgendaToken(): Promise<{ token: string; prefix: string }> {
  const token = randomBytes(24).toString("base64url");
  const prefix = token.slice(0, 6);
  const hash = hashToken(token);
  if (isPreviewMode()) {
    memory.push({ hash, prefix, revoked: false });
    return { token, prefix };
  }
  const admin = createAdminClient();
  await admin.from("agenda_feed_tokens").update({ revoked_at: new Date().toISOString() }).is("revoked_at", null);
  await admin.from("agenda_feed_tokens").insert({ token_hash: hash, token_prefix: prefix });
  return { token, prefix };
}

export async function revokeAgendaTokens() {
  if (isPreviewMode()) {
    memory.forEach((row) => {
      row.revoked = true;
    });
    return;
  }
  const admin = createAdminClient();
  await admin.from("agenda_feed_tokens").update({ revoked_at: new Date().toISOString() }).is("revoked_at", null);
}

export async function listAgendaTokenPrefixes() {
  if (isPreviewMode()) return memory.filter((row) => !row.revoked).map((row) => row.prefix);
  const admin = createAdminClient();
  const { data } = await admin.from("agenda_feed_tokens").select("token_prefix").is("revoked_at", null);
  return (data ?? []).map((row) => String(row.token_prefix));
}

export async function agendaTokenValid(token: string): Promise<boolean> {
  const hash = hashToken(token);
  if (isPreviewMode()) return memory.some((row) => row.hash === hash && !row.revoked);
  const admin = createAdminClient();
  const { data } = await admin
    .from("agenda_feed_tokens")
    .select("id")
    .eq("token_hash", hash)
    .is("revoked_at", null)
    .maybeSingle();
  return Boolean(data);
}
