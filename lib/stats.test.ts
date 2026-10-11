import { describe, expect, it } from "vitest";
import { buildStats, filterHeatByBot } from "@/lib/stats";
import { kindColor } from "@/lib/format";
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
    expect(stats.bots[0]?.activeDays).toBe(2);
    expect(stats.bots[0]?.perActiveDay).toBe(1);
  });

  it("agrega el heatmap por slug completo aunque tenga guiones", () => {
    const now = new Date("2026-10-10T18:00:00.000Z");
    const stay = {
      id: "b2",
      name: "Alojamiento Brasil 2027",
      slug: "alojamiento-brasil-2027",
      avatar_color: "teal",
    };
    const posts: Array<Post & { bot: typeof stay }> = [
      {
        id: "stay-1",
        bot_id: "b2",
        title: "Depto",
        body_markdown: "x",
        kind: "alojamiento",
        product: null,
        tags: [],
        created_at: "2026-10-10T16:00:00.000Z",
        updated_at: "2026-10-10T16:00:00.000Z",
        cover_image_url: null,
        images: [],
        event_at: null,
        event_end_at: null,
        details: {},
        bot: stay,
      },
      {
        id: "stay-2",
        bot_id: "b2",
        title: "Casa",
        body_markdown: "x",
        kind: "alojamiento",
        product: null,
        tags: [],
        created_at: "2026-10-09T16:00:00.000Z",
        updated_at: "2026-10-09T16:00:00.000Z",
        cover_image_url: null,
        images: [],
        event_at: null,
        event_end_at: null,
        details: {},
        bot: stay,
      },
    ];
    const stats = buildStats(posts, 30, now);
    expect(stats.heatmap.every((cell) => cell.bot === "alojamiento-brasil-2027")).toBe(true);
    expect(stats.heatmap.reduce((sum, cell) => sum + cell.count, 0)).toBe(2);
    expect(filterHeatByBot(stats.heatmap, "alojamiento-brasil-2027").length).toBeGreaterThan(0);
    expect(filterHeatByBot(stats.heatmap, "alojamiento")).toEqual([]);
    expect(stats.bots[0]?.activeDays).toBe(2);
    expect(stats.bots[0]?.perActiveDay).toBe(1);
  });

  it("usa un color distinto por tipo de post", () => {
    expect(kindColor("evento")).not.toBe(kindColor("ranking"));
    expect(kindColor("alojamiento")).not.toBe(kindColor("evento"));
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
