import { describe, expect, it } from "vitest";
import payloads from "@/docs/mendoza-payloads.json";
import { hashApiKey } from "@/lib/api-keys";
import { parsePostDetails } from "@/lib/details";
import { entryEmoji } from "@/lib/ics";
import {
  EMPTY_MZA_FILTERS,
  GRAN_MENDOZA,
  bucketMzaPosts,
  countdownLabel,
  dayHeading,
  matchesMzaFilters,
  promoExpiryLabel,
} from "@/lib/mendoza";
import { MemoryRepository } from "@/lib/memory-repository";
import { publishPost } from "@/lib/publishing";
import type { Post } from "@/lib/types";

const post = (id: string, extra: Partial<Post>): Post =>
  ({ id, bot_id: "b", title: id, body_markdown: "", kind: "evento-mza", product: null, tags: [], created_at: "2026-10-10T12:00:00Z", ...extra }) as Post;

describe("kinds de Mendoza", () => {
  it("los payloads de ejemplo validan y faltantes fallan", () => {
    for (const [kind, p] of Object.entries(payloads)) {
      expect(parsePostDetails(kind, p.details).ok).toBe(true);
    }
    expect(parsePostDetails("recital", { ...payloads.recital.details, ticket_url: undefined }).ok).toBe(false);
    expect(parsePostDetails("gastro", undefined).ok).toBe(false);
  });

  it("entradas opcionales y ticket_status opcional en recital", () => {
    expect(parsePostDetails("recital", { ...payloads.recital.details, ticket_status: undefined }).ok).toBe(true);
    const bad = parsePostDetails("evento-mza", { ...payloads["evento-mza"].details, presales: [{ label: "1ra", status: "rara" }] });
    expect(bad.ok).toBe(false);
    const ok = parsePostDetails("evento-mza", payloads["evento-mza"].details);
    expect(ok.ok && (ok.details as Record<string, unknown>).open_bar).toBe(true);
  });

  it("fechas: countdown, vencimiento y encabezados", () => {
    expect(countdownLabel("2026-10-18", "2026-10-18")).toBe("Hoy");
    expect(countdownLabel("2026-10-19", "2026-10-18")).toBe("Mañana");
    expect(countdownLabel("2026-10-24", "2026-10-18")).toBe("Quedan 6 días");
    expect(promoExpiryLabel("2026-10-21", "2026-10-18")).toBe("Vence en 3 días");
    expect(dayHeading("2026-10-24", "2026-10-18")).toBe("Sáb 24/10");
  });

  it("agenda viva: cambios arriba, por día, promos, sin fecha y pasados", () => {
    const now = new Date("2026-10-18T15:00:00Z");
    const b = bucketMzaPosts(
      [
        post("hoy", { event_at: "2026-10-18T22:00:00Z", details: { status: "activo" } }),
        post("cancelado", { event_at: "2026-10-20T22:00:00Z", details: { status: "cancelado" } }),
        post("viejo", { event_at: "2026-10-10T22:00:00Z" }),
        post("promo", { kind: "gastro", details: { type: "promo", promo_to: "2026-10-30" } }),
        post("sinfecha", { kind: "gastro", created_at: "2026-10-01T12:00:00Z", details: { type: "apertura" } }),
        post("sinfecha-vieja", { kind: "gastro", created_at: "2026-07-01T12:00:00Z", details: { type: "apertura" } }),
      ],
      now,
    );
    expect(b.changes.map((p) => p.id)).toEqual(["cancelado"]);
    // El cambiado/cancelado también aparece abajo, por su fecha, con la etiqueta.
    expect(b.days.map((d) => [d.day, d.posts.map((p) => p.id)])).toEqual([
      ["2026-10-18", ["hoy"]],
      ["2026-10-20", ["cancelado"]],
    ]);
    expect(b.promos.map((p) => p.id)).toEqual(["promo"]);
    expect(b.undated.map((p) => p.id)).toEqual(["sinfecha"]);
    expect(b.past.map((p) => p.id).sort()).toEqual(["sinfecha-vieja", "viejo"]);
  });

  it("filtros: zona, público, precio y género", () => {
    const p = post("r", { kind: "recital", details: payloads.recital.details });
    expect(matchesMzaFilters(p, "recital", { ...EMPTY_MZA_FILTERS, zones: GRAN_MENDOZA })).toBe(true);
    expect(matchesMzaFilters(p, "recital", { ...EMPTY_MZA_FILTERS, zones: ["san-rafael"] })).toBe(false);
    expect(matchesMzaFilters(p, "recital", { ...EMPTY_MZA_FILTERS, audience: ["familiar"] })).toBe(false);
    expect(matchesMzaFilters(p, "recital", { ...EMPTY_MZA_FILTERS, maxPrice: 40000, categories: ["rock"] })).toBe(true);
    expect(matchesMzaFilters(p, "recital", { ...EMPTY_MZA_FILTERS, free: true })).toBe(false);
  });

  it("emoji en la agenda/.ics según el kind", () => {
    const bot = { id: "b", name: "B", slug: "b", avatar_color: null, avatar_url: null };
    const base = { id: "x", date: "2026-10-24", title: "T", type: "evento" as const, postId: "x", bot };
    expect(entryEmoji({ ...base, kind: "evento-mza", details: { category: "sunset" } })).toBe("🌅");
    expect(entryEmoji({ ...base, kind: "gastro", details: { type: "food-truck" } })).toBe("🚚");
    expect(entryEmoji({ ...base, kind: "recital", details: { genre: "tango" } })).toBe("💃");
  });

  it("re-enviar el mismo source_id actualiza en vez de duplicar", async () => {
    const repo = new MemoryRepository();
    const key = "gb_test_mza";
    repo.bots.push({ id: "bot_m", name: "Recitales", slug: "recitales-mendoza", description: "", status: null, status_updated_at: null, created_at: "", updated_at: "" } as never);
    repo.keys.push({ botId: "bot_m", hash: hashApiKey(key), prefix: "gb_test_m", revokedAt: null } as never);
    const first = await publishPost(repo, `Bearer ${key}`, payloads.recital);
    expect(first.ok && first.status).toBe(201);
    const again = await publishPost(repo, `Bearer ${key}`, {
      ...payloads.recital,
      details: { ...payloads.recital.details, status: "agotado", ticket_status: "agotado" },
    });
    expect(again.ok && again.status).toBe(200);
    expect(repo.posts.filter((p) => p.bot_id === "bot_m")).toHaveLength(1);
    expect((repo.posts[0].details as Record<string, unknown>).ticket_status).toBe("agotado");
    const noDate = await publishPost(repo, `Bearer ${key}`, { ...payloads.recital, event_at: undefined, details: { ...payloads.recital.details, source_id: "otro" } });
    expect(noDate.ok).toBe(false);
  });
});
