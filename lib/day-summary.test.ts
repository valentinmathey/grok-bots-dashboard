import { describe, expect, it } from "vitest";
import { buildDaySummary } from "@/lib/day-summary";
import { resolveLastSeen } from "@/lib/last-seen";
import type { BotSummary, Post } from "@/lib/types";

const bot = { id: "b1", slug: "uno", name: "Uno" } as BotSummary;
const post = (id: string, extra: Partial<Post>): Post =>
  ({ id, bot_id: "b1", title: id, body_markdown: "", kind: "aviso", product: null, tags: [], created_at: "2026-10-10T12:00:00Z", ...extra }) as Post;

describe("resumen del día", () => {
  const now = new Date("2026-10-14T15:00:00Z");
  it("separa lo nuevo, los eventos y los audios de hoy", () => {
    const s = buildDaySummary(
      [bot],
      [
        post("nuevo", { created_at: "2026-10-14T14:00:00Z" }),
        post("viejo", {}),
        post("evento", { event_at: "2026-10-14T22:00:00Z" }),
        post("audio", { created_at: "2026-10-14T13:00:00Z", details: { audio_url: "https://x/a.mp3" } }),
      ],
      new Date("2026-10-14T13:30:00Z"),
      now,
    );
    expect(s.byBot[0].fresh.map((p) => p.id)).toEqual(["nuevo"]);
    expect(s.events.map((e) => e.post.id)).toEqual(["evento"]);
    expect(s.audios.map((e) => e.post.id)).toEqual(["audio"]);
  });

  it("toma la visita anterior como referencia", () => {
    const visitAt = "2026-10-14T10:00:00Z";
    expect(resolveLastSeen({ visitAt, lastSeen: "2026-10-13T10:00:00Z", now }).lastSeen).toBe("2026-10-14T10:00:00.000Z");
    expect(resolveLastSeen({ visitAt: "2026-10-14T14:50:00Z", lastSeen: "2026-10-13T10:00:00.000Z", now }).lastSeen).toBe("2026-10-13T10:00:00.000Z");
    expect(resolveLastSeen({ now }).since.toISOString()).toBe("2026-10-13T15:00:00.000Z");
  });
});
