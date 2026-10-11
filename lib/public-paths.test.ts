import { describe, expect, it } from "vitest";
import { isPublicPath } from "@/lib/public-paths";

describe("rutas públicas PWA", () => {
  it("deja pasar manifest, SW, iconos y offline sin login", () => {
    expect(isPublicPath("/manifest.webmanifest")).toBe(true);
    expect(isPublicPath("/sw.js")).toBe(true);
    expect(isPublicPath("/offline")).toBe(true);
    expect(isPublicPath("/api/agenda.ics")).toBe(true);
    expect(isPublicPath("/icons/icon-192.png")).toBe(true);
    expect(isPublicPath("/icon.svg")).toBe(true);
    expect(isPublicPath("/favicon.ico")).toBe(true);
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/bots/reportero")).toBe(false);
  });
});
