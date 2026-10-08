import { describe, expect, it } from "vitest";
import {
  filtersToSearchParams,
  hasActiveFilters,
  matchesFilters,
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
});
