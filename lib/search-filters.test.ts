import { describe, expect, it } from "vitest";
import {
  EMPTY_SEARCH_UI_FILTERS,
  countSearchUiFilters,
  matchingSearchDatePreset,
  matchesSearchUiFilters,
  parseSearchUiFilters,
  searchDatePresetRange,
  searchUiHref,
  kindsForGroups,
} from "./search-filters";
import type { Post } from "./types";

const post = (partial: Partial<Post> & { slug?: string } = {}): Post & { bot: { id: string; name: string; slug: string; avatar_color: null; avatar_url: null } } =>
  ({
    id: partial.id ?? "1",
    bot_id: "b",
    title: "T",
    body_markdown: "",
    kind: partial.kind ?? "evento",
    product: null,
    tags: [],
    created_at: "2026-11-01T12:00:00Z",
    event_at: partial.event_at ?? "2026-11-12T22:00:00.000Z",
    event_end_at: null,
    details: partial.details ?? {},
    bot: {
      id: "b",
      name: "Bot",
      slug: partial.slug ?? "eventos-tech-mdz",
      avatar_color: null,
      avatar_url: null,
    },
    ...partial,
  }) as never;

describe("search-filters", () => {
  it("presets de fecha: N días inclusivos desde hoy Mendoza", () => {
    const now = new Date("2026-11-09T15:00:00-03:00");
    expect(searchDatePresetRange("7", now)).toEqual({ from: "2026-11-09", to: "2026-11-15" });
    expect(searchDatePresetRange("30", now)).toEqual({ from: "2026-11-09", to: "2026-12-08" });
    expect(matchingSearchDatePreset({ from: "2026-11-09", to: "2026-11-15" }, now)).toBe("7");
  });

  it("sin event_at queda fuera si hay fecha activa", () => {
    const f = { ...EMPTY_SEARCH_UI_FILTERS, datePreset: "7" as const, from: "2026-11-09", to: "2026-11-15" };
    expect(matchesSearchUiFilters(post({ event_at: null }), f, { now: new Date("2026-11-09T12:00:00-03:00") })).toBe(false);
    expect(
      matchesSearchUiFilters(
        post({ event_at: "2026-11-12T22:00:00.000Z" }),
        f,
        { now: new Date("2026-11-09T12:00:00-03:00") },
      ),
    ).toBe(true);
  });

  it("edad exacta y apto menores", () => {
    expect(matchesSearchUiFilters(post({ details: { age_min: 21 } }), { ...EMPTY_SEARCH_UI_FILTERS, age: "21" })).toBe(true);
    expect(matchesSearchUiFilters(post({ details: { age_min: 23 } }), { ...EMPTY_SEARCH_UI_FILTERS, age: "21" })).toBe(false);
    expect(matchesSearchUiFilters(post({ details: {} }), { ...EMPTY_SEARCH_UI_FILTERS, age: "menores" })).toBe(true);
    expect(matchesSearchUiFilters(post({ details: { age_min: 18 } }), { ...EMPTY_SEARCH_UI_FILTERS, age: "menores" })).toBe(false);
  });

  it("gratis/pago, audio, inscripción, buy_before, grupos de kind", () => {
    expect(matchesSearchUiFilters(post({ details: { price_from: 0 } }), { ...EMPTY_SEARCH_UI_FILTERS, price: "gratis" })).toBe(true);
    expect(matchesSearchUiFilters(post({ details: { price_from: 100 } }), { ...EMPTY_SEARCH_UI_FILTERS, price: "gratis" })).toBe(false);
    expect(
      matchesSearchUiFilters(post({ details: { audio_url: "https://x.test/a.mp3" } }), {
        ...EMPTY_SEARCH_UI_FILTERS,
        hasAudio: true,
      }),
    ).toBe(true);
    expect(
      matchesSearchUiFilters(post({ id: "p1" }), { ...EMPTY_SEARCH_UI_FILTERS, registered: "si" }, {
        registeredIds: new Set(["p1"]),
      }),
    ).toBe(true);
    expect(
      matchesSearchUiFilters(post({ id: "p1" }), { ...EMPTY_SEARCH_UI_FILTERS, registered: "no" }, {
        registeredIds: new Set(["p1"]),
      }),
    ).toBe(false);
    expect(
      matchesSearchUiFilters(
        post({ details: { buy_before: "2026-11-20" } }),
        { ...EMPTY_SEARCH_UI_FILTERS, buyBeforeSoon: true },
        { now: new Date("2026-11-09T12:00:00-03:00") },
      ),
    ).toBe(true);
    expect(
      matchesSearchUiFilters(
        post({ details: { buy_before: "2026-11-01" } }),
        { ...EMPTY_SEARCH_UI_FILTERS, buyBeforeSoon: true },
        { now: new Date("2026-11-09T12:00:00-03:00") },
      ),
    ).toBe(false);
    expect(kindsForGroups(["eventos", "finanzas"])).toEqual(
      expect.arrayContaining(["evento", "evento-mza", "informe"]),
    );
    expect(matchesSearchUiFilters(post({ kind: "ranking" }), { ...EMPTY_SEARCH_UI_FILTERS, kindGroups: ["productos"] })).toBe(true);
  });

  it("parsea URL y cuenta filtros", () => {
    const f = parseSearchUiFilters({
      cuando: "15",
      importance: "imperdible,bueno",
      estado: "cambiado",
      precio: "gratis",
      edad: "18",
      comprar: "1",
      inscripto: "si",
      audio: "1",
      favorites: "1",
      tipo: "eventos,finanzas",
      bot: "fiestas-mendoza",
    });
    expect(f.datePreset).toBe("15");
    expect(f.from).toBeTruthy();
    expect(f.importance).toEqual(["imperdible", "bueno"]);
    expect(f.status).toEqual(["cambiado"]);
    expect(f.price).toBe("gratis");
    expect(f.age).toBe("18");
    expect(f.buyBeforeSoon).toBe(true);
    expect(f.registered).toBe("si");
    expect(f.hasAudio).toBe(true);
    expect(f.favoritesOnly).toBe(true);
    expect(f.kindGroups).toEqual(["eventos", "finanzas"]);
    expect(f.bots).toEqual(["fiestas-mendoza"]);
    expect(countSearchUiFilters(f)).toBeGreaterThanOrEqual(10);
    expect(searchUiHref("n8n", EMPTY_SEARCH_UI_FILTERS, { favoritesOnly: true })).toContain("favorites=1");
  });
});
