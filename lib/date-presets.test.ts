import { describe, expect, it } from "vitest";
import { formatDmy, matchingPreset, presetRange, todayYmd } from "@/lib/date-presets";

// Domingo 11/10/2026 23:30 ART = lunes 12/10 02:30 UTC
const lateSunday = new Date("2026-10-12T02:30:00Z");

describe("date presets (ART)", () => {
  it("usa el día de Argentina, no UTC", () => {
    expect(todayYmd(lateSunday)).toBe("2026-10-11");
  });
  it("semana lunes a domingo", () => {
    expect(presetRange("semana", lateSunday)).toEqual({ from: "2026-10-05", to: "2026-10-11" });
  });
  it("mes, hoy y próximos 30", () => {
    expect(presetRange("mes", lateSunday)).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(presetRange("hoy", lateSunday)).toEqual({ from: "2026-10-11", to: "2026-10-11" });
    expect(presetRange("proximos30", lateSunday)).toEqual({ from: "2026-10-11", to: "2026-11-10" });
  });
  it("detecta el preset activo y formatea dd/mm/aaaa", () => {
    expect(matchingPreset({ from: "2026-10-01", to: "2026-10-31" }, lateSunday)).toBe("mes");
    expect(matchingPreset({ from: "2026-10-01" }, lateSunday)).toBeNull();
    expect(formatDmy("2026-10-12")).toBe("12/10/2026");
    expect(formatDmy("")).toBe("");
  });
});
