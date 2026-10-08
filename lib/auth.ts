import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isOwnerEmail } from "@/lib/owner";

export async function getSessionEmail(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return typeof data?.claims?.email === "string" ? data.claims.email : null;
}

export async function requireOwnerEmail(): Promise<string> {
  const email = await getSessionEmail();
  if (!isOwnerEmail(email)) {
    redirect("/login");
  }
  return email as string;
}

export async function getOwnerFromRequest(): Promise<string | null> {
  const email = await getSessionEmail();
  return isOwnerEmail(email) ? (email as string) : null;
}
