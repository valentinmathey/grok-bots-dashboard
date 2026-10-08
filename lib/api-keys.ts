import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const KEY_PREFIX = "gb_";

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

export function generateApiKey(): {
  key: string;
  hash: string;
  prefix: string;
} {
  const key = `${KEY_PREFIX}${randomBytes(32).toString("base64url")}`;
  return {
    key,
    hash: hashApiKey(key),
    prefix: key.slice(0, 10),
  };
}

export function hashesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function parseBearerToken(header: string | null | undefined): string | null {
  if (!header) {
    return null;
  }
  const match = header.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}
