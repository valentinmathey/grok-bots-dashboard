import { describe, expect, it } from "vitest";
import {
  DEFAULT_STATS_LAYOUT,
  bubbleRadius,
  cardSpansFull,
  deltaPct,
  median,
  mergeStatsLayout,
  movingAverage,
  parseStatsBots,
  parseStatsPeriod,
  spanFullIds,
  statsHref,
  statsSubtitle,
} from "@/lib/stats-layout";

describe("layout y filtros de estadísticas", () => {
  it("mezcla un layout guardado con las cards nuevas y descarta ids viejos", () => {
    const merged = mergeStatsLayout({
      order: ["insights", "kpi", "ghost"],
      hidden: ["tipos", "ghost"],
      collapsed: ["horario"],
    });
    expect(merged.order[0]).toBe("insights");
    expect(merged.order).toContain("comparativa");
    expect(merged.order).toContain("constancia");
    expect(merged.order).not.toContain("ghost");
    expect(merged.hidden).toEqual(["tipos"]);
    expect(merged).not.toHaveProperty("collapsed");
    expect(mergeStatsLayout(null).order).toEqual(DEFAULT_STATS_LAYOUT.order);
  });

  it("inserta Constancia justo después de Posts por bot", () => {
    const merged = mergeStatsLayout({
      order: ["kpi", "posts-bot", "actividad", "horario", "tipos", "tags", "insights", "comparativa"],
    });
    expect(merged.order.indexOf("constancia")).toBe(merged.order.indexOf("posts-bot") + 1);
  });

  it("estira la media card huérfana en su fila", () => {
    expect([...spanFullIds(["kpi", "posts-bot", "actividad"])]).toEqual(["posts-bot"]);
    expect([...spanFullIds(["posts-bot", "constancia"])]).toEqual([]);
    expect(cardSpansFull("posts-bot", ["posts-bot", "actividad"])).toBe(true);
    expect(cardSpansFull("posts-bot", ["posts-bot", "constancia"])).toBe(false);
    expect(cardSpansFull("kpi", ["kpi"])).toBe(true);
    expect(bubbleRadius(10, 10)).toBe(26);
    expect(bubbleRadius(0, 10)).toBe(8);
  });

  it("arma la URL y el subtítulo según el filtro real", () => {
    expect(parseStatsPeriod("all")).toBe(0);
    expect(parseStatsPeriod(undefined)).toBe(30);
    expect(parseStatsBots("a,b", "legacy")).toEqual(["a", "b"]);
    expect(statsHref({ days: 30, bots: [] }, { days: 7, bots: ["scout"] })).toBe(
      "/estadisticas?days=7&bots=scout",
    );
    expect(
      statsSubtitle(
        [{ slug: "cazador", name: "Cazador de Oportunidades" }],
        [],
        30,
      ),
    ).toBe("Actividad de los bots, últimos 30 días.");
    expect(
      statsSubtitle(
        [{ slug: "cazador", name: "Cazador de Oportunidades" }],
        ["cazador"],
        30,
      ),
    ).toBe("Cazador de Oportunidades, últimos 30 días.");
  });

  it("calcula media móvil, mediana y delta", () => {
    expect(movingAverage([1, 3, 5, 7], 2)).toEqual([1, 2, 4, 6]);
    expect(median([1, 8, 3])).toBe(3);
    expect(deltaPct(12, 10)).toBe(20);
    expect(deltaPct(4, 0)).toBeNull();
  });
});
