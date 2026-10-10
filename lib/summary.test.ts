import { describe, expect, it } from "vitest";
import { hashApiKey } from "@/lib/api-keys";
import { MemoryRepository } from "@/lib/memory-repository";
import {
  baIsoWeekKey,
  buildResumenDetails,
  publishWeeklySummaryForBot,
  upsertWeeklySummary,
} from "@/lib/summary";

function seed() {
  const repo = new MemoryRepository();
  const now = new Date("2026-10-12T14:00:00.000Z");
  repo.bots.push(
    {
      id: "bot_crack",
      name: "Paraguayo Crack",
      slug: "paraguayo-crack",
      description: null,
      status: "Cerrando la semana",
      status_updated_at: now.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      avatar_color: "green",
    },
    {
      id: "bot_h",
      name: "Hospedajes",
      slug: "hospedajes",
      description: null,
      status: "Buscando",
      status_updated_at: now.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
  );
  repo.posts.push({
    id: "6fc7b0c0-0000-4000-8000-000000000010",
    bot_id: "bot_h",
    title: "Casa en Campeche",
    body_markdown: "ok",
    kind: "alojamiento",
    product: "Florianópolis",
    tags: [],
    created_at: "2026-10-10T12:00:00.000Z",
    details: {
      score: 8.7,
      price_per_person: 500,
      previous_price_per_person: 620,
      currency: "BRL",
      city: "Florianópolis",
    },
  });
  const key = "gb_crack";
  repo.keys.push({
    botId: "bot_crack",
    hash: hashApiKey(key),
    prefix: "gb_crack",
    revokedAt: null,
  });
  return { repo, key, now };
}

describe("resumen semanal", () => {
  it("arma week_key ISO en hora Argentina", () => {
    expect(baIsoWeekKey(new Date("2026-10-12T14:00:00.000Z"))).toMatch(
      /^\d{4}-W\d{2}$/,
    );
  });

  it("destaca el mejor score y las bajas de precio", () => {
    const { repo, now } = seed();
    const details = buildResumenDetails({
      bots: repo.bots,
      postsByBot: {
        bot_h: repo.posts,
        bot_crack: [],
      },
      now,
    });
    const hospedajes = details.bots.find((bot) => bot.slug === "hospedajes");
    expect(hospedajes?.new_posts).toBe(1);
    expect(hospedajes?.alojamientos?.best?.title).toBe("Casa en Campeche");
    expect(hospedajes?.alojamientos?.price_drops).toHaveLength(1);
  });

  it("es idempotente: la segunda corrida actualiza el mismo week_key", async () => {
    const { repo, now } = seed();
    const first = await upsertWeeklySummary(repo, now);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.data.created).toBe(true);
    const second = await upsertWeeklySummary(repo, now);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.data.created).toBe(false);
    expect(second.data.post.id).toBe(first.data.post.id);
    expect(repo.posts.filter((post) => post.kind === "resumen")).toHaveLength(1);
  });

  it("solo paraguayo-crack puede disparar el resumen a mano", async () => {
    const { repo, key, now } = seed();
    const forbidden = await publishWeeklySummaryForBot(repo, "Bearer gb_otro", now);
    expect(forbidden.ok).toBe(false);

    const ok = await publishWeeklySummaryForBot(repo, `Bearer ${key}`, now);
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.data.bot.slug).toBe("paraguayo-crack");
    }
  });
});
