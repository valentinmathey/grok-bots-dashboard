import { afterEach, describe, expect, it } from "vitest";
import { isOwnerEmail, normalizeEmail } from "@/lib/owner";

const ORIGINAL = process.env.OWNER_EMAIL;

afterEach(() => {
  if (ORIGINAL === undefined) {
    delete process.env.OWNER_EMAIL;
  } else {
    process.env.OWNER_EMAIL = ORIGINAL;
  }
});

describe("owner allowlist", () => {
  it("normaliza el email", () => {
    expect(normalizeEmail("  Ada@Example.com ")).toBe("ada@example.com");
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });

  it("solo acepta el email del dueño", () => {
    process.env.OWNER_EMAIL = "duenio@example.com";
    expect(isOwnerEmail("duenio@example.com")).toBe(true);
    expect(isOwnerEmail("  Duenio@Example.com ")).toBe(true);
    expect(isOwnerEmail("otro@example.com")).toBe(false);
    expect(isOwnerEmail(null)).toBe(false);
  });

  it("rechaza todo si falta OWNER_EMAIL", () => {
    delete process.env.OWNER_EMAIL;
    expect(isOwnerEmail("duenio@example.com")).toBe(false);
  });
});
