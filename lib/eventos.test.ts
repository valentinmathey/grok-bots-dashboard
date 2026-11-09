import { describe, expect, it } from "vitest";
import {
  EVENT_BOT_SLUGS,
  findeRange,
  filterAndSortEventos,
  matchesEventosFilters,
  parseEventosFilters,
  type EventosItem,
} from "./eventos";
import { EMPTY_EVENTOS_FILTERS } from "./eventos";

const bot = (slug: string, name = slug) => ({
  id: slug,
  name,
  slug,
  avatar_color: null,
  avatar_url: null,
});

const item = (partial: Partial<EventosItem> & { slug?: string }): EventosItem =>
  ({
    id: partial.id ?? "1",
    bot_id: "b",
    title: partial.title ?? "T",
    body_markdown: "",
    kind: partial.kind ?? "evento",
    product: null,
    tags: [],
    created_at: "2026-11-01T12:00:00Z",
    event_at: partial.event_at ?? "2026-11-14T22:00:00.000Z", // sáb 14/11 19:00 AR
    event_end_at: null,
    details: partial.details ?? {},
    bot: bot(partial.slug ?? "eventos-tech-mdz"),
    ...partial,
  }) as EventosItem;

describe("eventos", () => {
  it("tiene los 4 bots", () => {
    expect(EVENT_BOT_SLUGS).toEqual([
      "eventos-tech-mdz",
      "fiestas-mendoza",
      "gastronomia-mendoza",
      "recitales-mendoza",
    ]);
  });

  it("finde es sábado–domingo", () => {
    // viernes 13/11/2026
    const r = findeRange(new Date("2026-11-13T15:00:00-03:00"));
    expect(r).toEqual({ from: "2026-11-14", to: "2026-11-15" });
  });

  it("filtra bot, importancia, cambiados, edad y fechas", () => {
    const rows = [
      item({
        id: "a",
        slug: "fiestas-mendoza",
        kind: "evento-mza",
        details: { importance: "imperdible", status: "cambiado", age_min: 21 },
        event_at: "2026-11-14T22:00:00.000Z",
      }),
      item({
        id: "b",
        slug: "eventos-tech-mdz",
        details: { importance: "bueno", status: "activo" },
        event_at: "2026-11-18T22:00:00.000Z",
      }),
    ];
    expect(
      matchesEventosFilters(rows[0]!, {
        ...EMPTY_EVENTOS_FILTERS,
        bots: ["fiestas-mendoza"],
        importance: ["imperdible"],
        changedOnly: true,
        age: "21",
        from: "2026-11-14",
        to: "2026-11-14",
      }),
    ).toBe(true);
    expect(
      matchesEventosFilters(rows[1]!, {
        ...EMPTY_EVENTOS_FILTERS,
        changedOnly: true,
      }),
    ).toBe(false);
    expect(
      filterAndSortEventos(rows, {
        ...EMPTY_EVENTOS_FILTERS,
        importance: ["bueno"],
      }).map((r) => r.id),
    ).toEqual(["b"]);
  });

  it("parsea query string", () => {
    const f = parseEventosFilters({
      bot: "fiestas-mendoza,recitales-mendoza",
      importance: "imperdible,destacado",
      cambiados: "1",
      edad: "18",
      from: "2026-11-01",
      to: "2026-11-30",
      sort: "importancia",
    });
    expect(f.bots).toEqual(["fiestas-mendoza", "recitales-mendoza"]);
    expect(f.importance).toEqual(["imperdible", "destacado"]);
    expect(f.changedOnly).toBe(true);
    expect(f.age).toBe("18");
    expect(f.sort).toBe("importancia");
  });
});
