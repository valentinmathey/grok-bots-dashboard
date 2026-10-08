function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getOwnerEmail(): string | undefined {
  return read("OWNER_EMAIL")?.toLowerCase();
}

export function getPublicSupabaseEnv(): { url: string; anonKey: string } {
  const url = read("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey =
    read("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
    read("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return { url, anonKey };
}

export function getServiceRoleKey(): string {
  const key = read("SUPABASE_SERVICE_ROLE_KEY");
  if (!key) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  }
  return key;
}

export function getSiteUrl(): string {
  const explicit = read("NEXT_PUBLIC_SITE_URL");
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const vercel = read("VERCEL_URL");
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }

  return "http://localhost:3000";
}

export function isPreviewMode(): boolean {
  return read("PREVIEW_FAKE_DATA") === "1";
}

export function isSupabaseConfigured(): boolean {
  try {
    getPublicSupabaseEnv();
    return Boolean(getOwnerEmail());
  } catch {
    return false;
  }
}
