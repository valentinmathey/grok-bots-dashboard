import { describe, expect, it } from "vitest";
import { isValidCron, nextRun } from "@/lib/routines-schedule";

describe("rutinas: próxima ejecución", () => {
  it("calcula en hora Mendoza (UTC-3)", () => {
    const from = new Date("2026-10-12T20:00:00Z");
    expect(nextRun("17 3 28 * *", "America/Mendoza", from)).toBe("2026-10-28T06:17:00.000Z");
  });
  it("null sin cron o inválido", () => {
    expect(nextRun(null)).toBeNull();
    expect(nextRun("nope")).toBeNull();
    expect(isValidCron("15 8 * * 1-5")).toBe(true);
  });
});
