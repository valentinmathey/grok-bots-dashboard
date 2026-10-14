import { describe, expect, it } from "vitest";
import { formatAudioPublished } from "@/components/AudiosList";

describe("meta de audios", () => {
  it("muestra fecha y hora de Mendoza, no la duración", () => {
    expect(formatAudioPublished("2026-10-14T10:12:00Z")).toMatch(/14 .*oct.* 2026 · 07:12$/);
  });
});
