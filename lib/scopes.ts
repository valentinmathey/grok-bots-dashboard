export const KEY_SCOPES = ["publish", "read:all"] as const;
export type KeyScope = (typeof KEY_SCOPES)[number];

export const SCOPE_PUBLISH: KeyScope = "publish";
export const SCOPE_READ_ALL: KeyScope = "read:all";

export function normalizeScopes(scopes?: string[] | null): KeyScope[] {
  const cleaned = (scopes ?? []).filter((scope): scope is KeyScope =>
    (KEY_SCOPES as readonly string[]).includes(scope),
  );
  return cleaned.length > 0 ? [...new Set(cleaned)] : [SCOPE_PUBLISH];
}

export function canWrite(scopes?: string[] | null): boolean {
  return normalizeScopes(scopes).includes(SCOPE_PUBLISH);
}

export function canReadAll(scopes?: string[] | null): boolean {
  return normalizeScopes(scopes).includes(SCOPE_READ_ALL);
}
