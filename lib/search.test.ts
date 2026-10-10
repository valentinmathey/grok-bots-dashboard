import { describe, expect, it } from "vitest";
import { highlightSnippet, memorySearch } from "@/lib/search";
import type { Post } from "@/lib/types";

const bot = {
  id: "bot_n8n",
  name: "n8n Experto",
  slug: "n8n-experto",
  avatar_color: "orange",
  avatar_url: null,
};

function post(partial: Partial<Post>): Post & { bot: typeof bot } {
  return {
    id: "p1",
    bot_id: bot.id,
    title: "Digest n8n",
    body_markdown: "Workflow de Telegram",
    kind: "workflow",
    product: null,
    tags: ["telegram"],
    created_at: "2026-10-10T12:00:00.000Z",
    updated_at: "2026-10-10T12:00:00.000Z",
    cover_image_url: null,
    images: [],
    event_at: null,
    event_end_at: null,
    details: { workflow_name: "Digest", services: ["telegram"] },
    ...partial,
    bot,
  };
}

describe("búsqueda en memoria", () => {
  it("encuentra n8n, Camboriu sin acento y logitech", () => {
    const posts = [
      post({ id: "1", title: "Digest n8n", body_markdown: "corrida ok" }),
      post({
        id: "2",
        title: "Depto en Camboriú",
        kind: "alojamiento",
        body_markdown: "cerca de la playa",
        details: { city: "Balneário Camboriú" },
      }),
      post({
        id: "3",
        title: "Logitech Z407",
        kind: "ranking",
        body_markdown: "comparación",
        details: { product_name: "Logitech Z407" },
      }),
    ];
    expect(memorySearch(posts, { q: "n8n" }).hits.map((hit) => hit.id)).toContain("1");
    expect(memorySearch(posts, { q: "Camboriu" }).hits.map((hit) => hit.id)).toContain("2");
    expect(memorySearch(posts, { q: "logitech" }).hits.map((hit) => hit.id)).toContain("3");
    expect(highlightSnippet("Logitech Z407 en oferta", "logitech")).toContain("<mark>");
  });
});
