import { describe, expect, it } from "vitest";
import { baWallAt } from "@/lib/event-time";
import {
  filtersToSearchParams,
  hasActiveFilters,
  matchesFilters,
  parseFeedQuery,
  parsePostFilters,
} from "@/lib/filters";
import type { Post } from "@/lib/types";

function post(overrides: Partial<Post> = {}): Post {
  return {
    id: "1",
    bot_id: "bot_1",
    title: "Hola",
    body_markdown: "cuerpo",
    kind: "report",
    product: "Atlas",
    tags: ["weekly"],
    created_at: "2026-10-08T15:00:00.000Z",
    ...overrides,
  };
}

describe("filtros", () => {
  it("parsea query string y ignora valores inválidos", () => {
    expect(
      parsePostFilters({
        from: "2026-10-01",
        to: "no-es-fecha",
        product: " Atlas ",
        kind: "report",
        tag: "#Weekly",
      }),
    ).toEqual({
      from: "2026-10-01",
      to: undefined,
      product: "Atlas",
      kind: "report",
      tag: "weekly",
    });
  });

  it("serializa filtros a la query", () => {
    expect(
      filtersToSearchParams({
        from: "2026-10-01",
        product: "Atlas",
        kind: "result",
      }).toString(),
    ).toBe("from=2026-10-01&product=Atlas&kind=result");
  });

  it("filtra por producto, tipo, tag y rango de fechas", () => {
    const sample = post();
    expect(matchesFilters(sample, { product: "atlas" })).toBe(true);
    expect(matchesFilters(sample, { product: "Otro" })).toBe(false);
    expect(matchesFilters(sample, { kind: "note" })).toBe(false);
    expect(matchesFilters(sample, { tag: "weekly" })).toBe(true);
    expect(matchesFilters(sample, { from: "2026-10-09" })).toBe(false);
    expect(matchesFilters(sample, { from: "2026-10-08", to: "2026-10-08" })).toBe(
      true,
    );
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ product: "Atlas" })).toBe(true);
  });

  it("acepta kind evento y otros slugs", () => {
    expect(parsePostFilters({ kind: "evento" }).kind).toBe("evento");
    expect(parsePostFilters({ kind: "123" }).kind).toBeUndefined();
    expect(matchesFilters(post({ kind: "evento" }), { kind: "evento" })).toBe(
      true,
    );
  });

  it("separa próximos y pasados por event_at (00:30 AR es hoy)", () => {
    const todayEarly = post({
      event_at: baWallAt(0, 0, 30).toISOString(),
    });
    const yesterday = post({
      event_at: baWallAt(-1, 19).toISOString(),
    });
    expect(matchesFilters(todayEarly, { when: "upcoming" })).toBe(true);
    expect(matchesFilters(yesterday, { when: "upcoming" })).toBe(false);
    expect(matchesFilters(yesterday, { when: "past" })).toBe(true);
    expect(matchesFilters(todayEarly, { when: "past" })).toBe(false);
  });

  it("filtra event_from / event_to sobre la fecha del evento", () => {
    const event = post({ event_at: "2026-10-13T22:00:00.000Z" });
    expect(matchesFilters(event, { event_from: "2026-10-13", event_to: "2026-10-13" })).toBe(
      true,
    );
    expect(matchesFilters(event, { event_from: "2026-10-14" })).toBe(false);
    expect(matchesFilters(post(), { event_from: "2026-10-01" })).toBe(false);
  });

  it("en un bot con eventos, from/to y when=upcoming van a la query", () => {
    const query = parseFeedQuery(
      { from: "2026-10-01", when: "past", sort: "oldest" },
      { hasEvents: true },
    );
    expect(query.when).toBe("past");
    expect(query.dateBasis).toBe("event");
    expect(query.eventsOnly).toBe(true);
    expect(query.sort).toBe("oldest");
    expect(filtersToSearchParams(query).get("when")).toBe("past");
  });
});
