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
      shouldCreateUser: false,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Falta configurar Supabase." };
  }
  const normalized = normalizeEmail(email);
  if (!normalized || !isOwnerEmail(normalized)) {
    return { ok: false, error: "Este dashboard es privado." };
  }
  if (!password) {
    return { ok: false, error: "Ingresá tu contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  });
  if (error) {
    return { ok: false, error: "Email o contraseña incorrectos." };
  }
  return { ok: true };
}
