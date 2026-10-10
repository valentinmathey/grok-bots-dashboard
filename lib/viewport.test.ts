import { describe, expect, it } from "vitest";
import { shouldAutoHideTabBar, tabDockHideOffset, visualViewportBottomInset } from "@/lib/viewport";

describe("viewport visual (Safari iOS)", () => {
  it("mide el solape de la toolbar inferior", () => {
    expect(visualViewportBottomInset(800, null)).toBe(0);
    expect(visualViewportBottomInset(800, { height: 800, offsetTop: 0 })).toBe(0);
    expect(visualViewportBottomInset(800, { height: 700, offsetTop: 0 })).toBe(100);
    expect(visualViewportBottomInset(800, { height: 700, offsetTop: 100 })).toBe(0);
  });

  it("esconde la tab bar por completo, no a medias", () => {
    expect(tabDockHideOffset()).toContain("100%");
    expect(tabDockHideOffset()).toContain("safe-area-inset-bottom");
    expect(tabDockHideOffset()).toContain("--vv-bottom");
  });

  it("no esconde la barra en Safari iOS (no PWA)", () => {
    expect(shouldAutoHideTabBar(true, false)).toBe(false);
    expect(shouldAutoHideTabBar(true, true)).toBe(true);
    expect(shouldAutoHideTabBar(false, false)).toBe(true);
  });
});
