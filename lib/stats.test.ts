import { describe, expect, it } from "vitest";
import { buildStats } from "@/lib/stats";
import type { Post } from "@/lib/types";

const bot = { id: "b1", name: "Reportero", slug: "reportero", avatar_color: "blue" };

describe("agregación de estadísticas", () => {
  it("cuenta posts por bot y por kind", () => {
    const now = new Date("2026-10-10T15:00:00.000Z");
    const posts: Array<Post & { bot: typeof bot }> = [
      {
        id: "1",
        bot_id: "b1",
        title: "A",
        body_markdown: "x",
        kind: "update",
        product: null,
        tags: ["weekly"],
        created_at: "2026-10-09T15:00:00.000Z",
        updated_at: "2026-10-09T15:00:00.000Z",
        cover_image_url: null,
        images: [],
        event_at: null,
        event_end_at: null,
        details: {},
        bot,
      },
      {
        id: "2",
        bot_id: "b1",
        title: "B",
        body_markdown: "x",
        kind: "evento",
        product: null,
        tags: ["agenda"],
        created_at: "2026-10-10T14:00:00.000Z",
        updated_at: "2026-10-10T14:00:00.000Z",
        cover_image_url: null,
        images: [],
        event_at: "2026-10-11T14:00:00.000Z",
        event_end_at: null,
        details: {},
        bot,
      },
    ];
    const stats = buildStats(posts, 30, now);
    expect(stats.bots[0]?.posts).toBe(2);
    expect(stats.kinds.find((row) => row.kind === "evento")?.count).toBe(1);
    expect(stats.insights.eventos).toBe(1);
    expect(stats.tags[0]?.tag).toBeDefined();
    expect(stats.heatmap.some((cell) => cell.count > 0)).toBe(true);
    expect(stats.kpis.find((row) => row.key === "posts")?.value).toBe(2);
    expect(stats.domain.eventsNext7).toBe(1);
  });

  it("compara el período actual contra el anterior", () => {
    const now = new Date("2026-10-10T15:00:00.000Z");
    const posts: Array<Post & { bot: typeof bot }> = [
      {
        id: "old",
        bot_id: "b1",
        title: "Viejo",
        body_markdown: "x",
        kind: "update",
        product: null,
        tags: [],
        created_at: "2026-09-28T15:00:00.000Z",
        updated_at: "2026-09-28T15:00:00.000Z",
        cover_image_url: null,
        images: [],
        event_at: null,
        event_end_at: null,
        details: {},
        bot,
      },
      {
        id: "new",
        bot_id: "b1",
        title: "Nuevo",
        body_markdown: "x",
        kind: "update",
        product: null,
        tags: [],
        created_at: "2026-10-09T15:00:00.000Z",
        updated_at: "2026-10-09T15:00:00.000Z",
        cover_image_url: null,
        images: [],
        event_at: null,
        event_end_at: null,
        details: {},
        bot,
      },
    ];
    const stats = buildStats(posts, 7, now);
    const kpi = stats.kpis.find((row) => row.key === "posts");
    expect(kpi?.value).toBe(1);
    expect(kpi?.previous).toBe(1);
    expect(kpi?.delta).toBe(0);
  });
});
