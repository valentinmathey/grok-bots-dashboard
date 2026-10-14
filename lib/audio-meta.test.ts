import { describe, expect, it } from "vitest";
import { formatAudioPublished } from "@/components/AudiosList";

describe("meta de audios", () => {
  it("muestra fecha y hora de Mendoza, no la duración", () => {
    expect(formatAudioPublished("2026-10-14T10:12:00Z")).toMatch(/14 .*oct.* 2026 · 07:12$/);
  });
});

describe("formato de hora de la app", () => {
  it("siempre Mendoza y 24 h", async () => {
    const { formatDateTime, formatTime } = await import("@/lib/format");
    expect(formatTime("2026-10-15T01:17:00Z")).toBe("22:17");
    expect(formatDateTime("2026-10-15T01:17:00Z")).toMatch(/^14 .*oct.* 2026 · 22:17$/);
    expect(formatDateTime("2026-10-15T01:17:00Z")).not.toMatch(/m\./);
  });
});
