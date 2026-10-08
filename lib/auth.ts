import { redirect } from "next/navigation";
import { isPreviewMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { isOwnerEmail } from "@/lib/owner";

const PREVIEW_EMAIL = "preview@local";

export async function getSessionEmail(): Promise<string | null> {
  if (isPreviewMode()) {
    return PREVIEW_EMAIL;
  }
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return typeof data?.claims?.email === "string" ? data.claims.email : null;
}

export async function requireOwnerEmail(): Promise<string> {
  if (isPreviewMode()) {
    return PREVIEW_EMAIL;
  }
  const email = await getSessionEmail();
  if (!isOwnerEmail(email)) {
    redirect("/login");
  }
  return email as string;
}

export async function getOwnerFromRequest(): Promise<string | null> {
  if (isPreviewMode()) {
    return PREVIEW_EMAIL;
  }
  const email = await getSessionEmail();
  return isOwnerEmail(email) ? (email as string) : null;
}
