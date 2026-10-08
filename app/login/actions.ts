"use server";

import { isOwnerEmail, normalizeEmail } from "@/lib/owner";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function requestMagicLink(
  email: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "Falta configurar las variables de entorno de Supabase y OWNER_EMAIL.",
    };
  }

  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { ok: false, error: "Ingresá un email válido." };
  }

  if (!isOwnerEmail(normalized)) {
    return { ok: false, error: "Este dashboard es privado." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
