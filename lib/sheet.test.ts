import { describe, expect, it } from "vitest";
import { shouldDismissSheet } from "@/lib/sheet";

describe("arrastre de hoja inferior", () => {
  it("cierra si bajás más del 30% o con un flick", () => {
    expect(shouldDismissSheet({ offsetY: 0, height: 400, velocityY: 0 })).toBe(false);
    expect(shouldDismissSheet({ offsetY: 100, height: 400, velocityY: 0 })).toBe(false);
    expect(shouldDismissSheet({ offsetY: 121, height: 400, velocityY: 0 })).toBe(true);
    expect(shouldDismissSheet({ offsetY: 40, height: 400, velocityY: 0.9 })).toBe(true);
    expect(shouldDismissSheet({ offsetY: -20, height: 400, velocityY: 2 })).toBe(false);
  });
});
