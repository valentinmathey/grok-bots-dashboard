import { getOwnerEmail } from "@/lib/env";

export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) {
    return null;
  }
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  const owner = getOwnerEmail();
  const candidate = normalizeEmail(email);
  return Boolean(owner && candidate && owner === candidate);
}
