import { describe, expect, it } from "vitest";
import { filtersToSearchParams, matchesFilters, parseFeedQuery, sortPosts } from "@/lib/filters";
import type { Post } from "@/lib/types";

const base = { bot_id: "b", body_markdown: "", kind: "alojamiento", product: null, tags: [] };
const posts = [
  { ...base, id: "1", title: "A", created_at: "2026-10-01T00:00:00Z", details: { score: 9, availability: "ocupado" } },
  { ...base, id: "2", title: "B", created_at: "2026-10-02T00:00:00Z", details: { score: 5 } },
] as unknown as Post[];

describe("disponibilidad de alojamientos", () => {
  it("parsea y serializa ?disp", () => {
    const q = parseFeedQuery({ disp: "ocupado" });
    expect(q.availability).toBe("ocupado");
    expect(filtersToSearchParams(q).get("disp")).toBe("ocupado");
    expect(parseFeedQuery({ disp: "x" }).availability).toBeUndefined();
  });
  it("filtra (sin campo = disponible) y manda los ocupados al final", () => {
    expect(posts.filter((p) => matchesFilters(p, { availability: "disponible" })).map((p) => p.id)).toEqual(["2"]);
    expect(sortPosts(posts, "score").map((p) => p.id)).toEqual(["2", "1"]);
  });
});
