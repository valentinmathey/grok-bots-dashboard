import { describe, expect, it } from "vitest";
import {
  generateApiKey,
  hashApiKey,
  hashesMatch,
  parseBearerToken,
} from "@/lib/api-keys";

describe("api keys", () => {
  it("genera una clave con prefijo gb_ y un hash sha256", () => {
    const generated = generateApiKey();
    expect(generated.key.startsWith("gb_")).toBe(true);
    expect(generated.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(generated.hash).toBe(hashApiKey(generated.key));
    expect(generated.prefix).toBe(generated.key.slice(0, 10));
  });

  it("no guarda la clave en el hash de forma reversible", () => {
    const generated = generateApiKey();
    expect(generated.hash.includes(generated.key)).toBe(false);
  });

  it("compara hashes en tiempo constante cuando coinciden", () => {
    const hash = hashApiKey("gb_demo");
    expect(hashesMatch(hash, hashApiKey("gb_demo"))).toBe(true);
    expect(hashesMatch(hash, hashApiKey("gb_otro"))).toBe(false);
  });

  it("parsea Authorization Bearer", () => {
    expect(parseBearerToken("Bearer gb_abc")).toBe("gb_abc");
    expect(parseBearerToken("bearer gb_abc")).toBe("gb_abc");
    expect(parseBearerToken("Basic abc")).toBeNull();
    expect(parseBearerToken(null)).toBeNull();
    expect(parseBearerToken("Bearer")).toBeNull();
  });
});
