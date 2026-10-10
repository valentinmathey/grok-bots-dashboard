import { describe, expect, it } from "vitest";
import { applyBotOrder, compareBotOrder, nextSortOrder } from "@/lib/bot-order";
import { MemoryRepository } from "@/lib/memory-repository";

describe("orden de bots", () => {
  it("ordena por sort_order y manda los nuevos al final", async () => {
    const repo = new MemoryRepository();
    const first = await repo.createBot({
      name: "Alpha",
      slug: "alpha",
      description: null,
      avatar_color: null,
      avatar_shape: null,
      avatar_url: null,
      keyHash: "h1",
      keyPrefix: "gb_aa",
    });
    const second = await repo.createBot({
      name: "Beta",
      slug: "beta",
      description: null,
      avatar_color: null,
      avatar_shape: null,
      avatar_url: null,
      keyHash: "h2",
      keyPrefix: "gb_bb",
    });
    expect(first.sort_order).toBe(0);
    expect(second.sort_order).toBe(1);

    const reordered = await repo.reorderBots([second.id, first.id]);
    expect(reordered.map((bot) => bot.slug)).toEqual(["beta", "alpha"]);

    const third = await repo.createBot({
      name: "Gamma",
      slug: "gamma",
      description: null,
      avatar_color: null,
      avatar_shape: null,
      avatar_url: null,
      keyHash: "h3",
      keyPrefix: "gb_cc",
    });
    expect(third.sort_order).toBe(2);
    const listed = await repo.listBots();
    expect(listed.map((bot) => bot.slug)).toEqual(["beta", "alpha", "gamma"]);
  });

  it("compare y apply conservan el resto", () => {
    expect(nextSortOrder([{ sort_order: 2 }, { sort_order: 0 }])).toBe(3);
    expect(
      compareBotOrder({ name: "B", sort_order: 1 }, { name: "A", sort_order: 2 }),
    ).toBeLessThan(0);
    expect(
      applyBotOrder(
        [{ id: "a" }, { id: "b" }, { id: "c" }],
        ["c", "a"],
      ).map((item) => item.id),
    ).toEqual(["c", "a", "b"]);
  });
});
