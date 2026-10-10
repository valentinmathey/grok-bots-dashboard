import { describe, expect, it } from "vitest";
import { MemoryRepository } from "@/lib/memory-repository";
import { buildResumenDetails, upsertWeeklySummary } from "@/lib/summary";

describe("resumen semanal", () => {
  it("destaca el mejor score y las bajas de precio", () => {
    const now = new Date("2026-10-12T14:00:00.000Z");
    const details = buildResumenDetails({
      bots: [
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
      ],
      postsByBot: {
        bot_h: [
          {
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
            },
          },
        ],
      },
      now,
    });
    expect(details.week_key).toMatch(/^\d{4}-W\d{2}$/);
    expect(details.bots[0]?.alojamientos?.best?.title).toBe("Casa en Campeche");
    expect(details.bots[0]?.alojamientos?.price_drops).toHaveLength(1);
  });

  it("es idempotente por week_key", async () => {
    const repo = new MemoryRepository();
    const now = new Date("2026-10-12T14:00:00.000Z");
    repo.bots.push({
      id: "bot_crack",
      name: "Paraguayo Crack",
      slug: "paraguayo-crack",
      description: null,
      status: null,
      status_updated_at: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
    const first = await upsertWeeklySummary(repo, now);
    const second = await upsertWeeklySummary(repo, now);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.data.created).toBe(true);
    expect(second.data.created).toBe(false);
    expect(second.data.post.id).toBe(first.data.post.id);
  });
});
