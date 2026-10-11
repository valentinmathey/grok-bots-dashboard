import { describe, expect, it } from "vitest";
import {
  DEFAULT_STATS_LAYOUT,
  deltaPct,
  median,
  mergeStatsLayout,
  movingAverage,
  parseStatsBots,
  parseStatsPeriod,
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
    expect(merged.order).not.toContain("ghost");
    expect(merged.hidden).toEqual(["tipos"]);
    expect(merged.collapsed).toEqual(["horario"]);
    expect(mergeStatsLayout(null).order).toEqual(DEFAULT_STATS_LAYOUT.order);
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
