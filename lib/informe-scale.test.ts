import { describe, expect, it } from "vitest";
import { inflationScale } from "./informe";

describe("inflationScale", () => {
  it("hace zoom alrededor de los valores", () => {
    const s = inflationScale(1_000_000, 1_019_000, [1_020_000, 1_018_700, 1_015_000]);
    expect(s.min).toBe(1_000_000);
    expect(s.pct(1_000_000)).toBe(0);
    expect(s.pct(1_019_000)).toBeGreaterThan(80);
    expect(s.pct(1_019_000)).toBeLessThan(95);
    expect(s.pct(1_020_000) - s.pct(1_018_700)).toBeGreaterThan(5);
  });
  it("baja el mínimo si un valor pierde plata", () => {
    const s = inflationScale(1_000_000, 1_019_000, [990_000]);
    expect(s.min).toBeLessThan(990_000);
    expect(s.pct(990_000)).toBeGreaterThan(0);
  });
});
