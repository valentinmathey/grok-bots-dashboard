import { describe, expect, it } from "vitest";
import {
  buildPushPayload,
  classifyPublish,
  shouldThrottle,
  NEW_POST_THROTTLE_MS,
} from "@/lib/push-payload";
import type { Post } from "@/lib/types";

const bot = { id: "bot_1", name: "Agenda", slug: "agenda" };

function post(partial: Partial<Post>): Post {
  return {
    id: "post_1",
    bot_id: bot.id,
    title: "Demo",
    body_markdown: "hola",
    kind: "update",
    product: null,
    tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    cover_image_url: null,
    images: [],
    event_at: null,
    event_end_at: null,
    details: {},
    ...partial,
  };
}

describe("payload de push", () => {
  it("arma new_post y colapsa varios en un lote", () => {
    const one = buildPushPayload({ type: "new_post", bot, post: post({ title: "Hola" }) });
    expect(one.title).toBe("Agenda");
    expect(one.body).toBe("Hola");
    expect(one.tag).toBe("new-post:agenda");
    expect(one.url).toContain("#post-post_1");

    const many = buildPushPayload({ type: "new_post", bot, count: 5 });
    expect(many.body).toBe("Agenda publicó 5 posts");
  });

  it("detecta bajada de precio en ranking y alojamiento", () => {
    expect(
      classifyPublish(
        post({
          kind: "ranking",
          details: {
            product_name: "Z407",
            previous_best_price: 200,
            offers: [{ store: "Mexx", url: "https://mexx.com/z", price: 150 }],
          },
        }),
      ).type,
    ).toBe("price_drop");
    expect(
      classifyPublish(
        post({
          kind: "alojamiento",
          details: { previous_price_total: 900, price_total: 700 },
        }),
      ).type,
    ).toBe("price_drop");
    expect(classifyPublish(post({ kind: "update" })).type).toBe("new_post");
  });
});

describe("throttle de new_post", () => {
  it("deja pasar el primero y frena el siguiente en 10 min", () => {
    const now = 1_000_000;
    expect(shouldThrottle(null, now)).toBe(false);
    expect(shouldThrottle(now - 60_000, now)).toBe(true);
    expect(shouldThrottle(now - NEW_POST_THROTTLE_MS - 1, now)).toBe(false);
  });
});
