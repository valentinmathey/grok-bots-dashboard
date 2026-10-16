import { describe, expect, it, vi } from "vitest";
import { applyAppBadge } from "@/lib/app-badge";

describe("badge del ícono", () => {
  it("pone el número, limpia en cero y no falla sin soporte", async () => {
    const nav = { setAppBadge: vi.fn(async () => {}), clearAppBadge: vi.fn(async () => {}) };
    expect(await applyAppBadge(3, nav)).toBe(true);
    expect(nav.setAppBadge).toHaveBeenCalledWith(3);
    await applyAppBadge(0, nav);
    expect(nav.clearAppBadge).toHaveBeenCalled();
    expect(await applyAppBadge(2, {})).toBe(false);
    expect(await applyAppBadge(2, { setAppBadge: async () => { throw new Error("no"); } })).toBe(false);
  });
});
