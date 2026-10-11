import { describe, expect, it } from "vitest";
import type { AgendaEntry } from "@/lib/agenda";
import {
  buildMonthGrid,
  agendaHref,
  formatAgendaDayHeading,
  formatMonthTitle,
  stripDateFromTitle,
  mondayOnOrBefore,
  monthBounds,
} from "@/lib/calendar";

const bot = {
  id: "b1",
  name: "Agenda",
  slug: "agenda",
  avatar_color: "violet",
  avatar_url: null,
};

function entry(partial: Partial<AgendaEntry> & Pick<AgendaEntry, "id" | "date" | "title">): AgendaEntry {
  return {
    type: "evento",
    postId: partial.id,
    bot,
    ...partial,
  };
}

describe("grilla de calendario (ART)", () => {
  it("empieza el lunes anterior y muestra días del mes vecino", () => {
    expect(monthBounds("2026-10")).toEqual({ start: "2026-10-01", end: "2026-10-31" });
    expect(mondayOnOrBefore("2026-10-01")).toBe("2026-09-28");
    const weeks = buildMonthGrid("2026-10", "2026-10-11", []);
    expect(weeks[0]?.days[0]?.ymd).toBe("2026-09-28");
    expect(weeks[0]?.days[0]?.inMonth).toBe(false);
    expect(weeks[0]?.days[3]?.ymd).toBe("2026-10-01");
    expect(weeks[0]?.days[3]?.inMonth).toBe(true);
    expect(weeks.at(-1)?.days.at(-1)?.ymd).toBe("2026-11-01");
  });

  it("marca hoy y el finde, y pinta un viaje de varios días como barra continua", () => {
    const trip = entry({
      id: "tr-1",
      date: "2026-10-08",
      endDate: "2026-10-10",
      title: "Viaje Brasil",
      type: "viaje",
    });
    const demo = entry({
      id: "ev-1",
      date: "2026-10-08",
      title: "Demo",
      startsAt: "2026-10-08T22:00:00.000Z",
    });
    const weeks = buildMonthGrid("2026-10", "2026-10-08", [trip, demo]);
    const week = weeks.find((item) => item.days.some((day) => day.ymd === "2026-10-08"));
    expect(week?.days.find((day) => day.ymd === "2026-10-08")?.isToday).toBe(true);
    expect(week?.days.find((day) => day.ymd === "2026-10-10")?.isWeekend).toBe(true);
    expect(week?.spans).toHaveLength(1);
    expect(week?.spans[0]?.colStart).toBe(3);
    expect(week?.spans[0]?.colEnd).toBe(5);
    expect(week?.pills[3]?.map((item) => item.id)).toEqual(["ev-1"]);
  });

  it("formatea el mes y el encabezado de lista en español", () => {
    expect(formatMonthTitle("2026-10")).toBe("Octubre 2026");
    expect(formatAgendaDayHeading("2026-10-12", "2026-10-11", "2026-10-12")).toBe("Mañana");
    expect(formatAgendaDayHeading("2026-10-12", "2026-10-12", "2026-10-13")).toBe("Hoy");
    expect(formatAgendaDayHeading("2026-10-12", "2026-10-01", "2026-10-02")).toBe(
      "Lunes 12 de octubre",
    );
  });

  it("saca la fecha duplicada del título si ya está en el encabezado", () => {
    expect(stripDateFromTitle("Undercode Day 2026 (lun 12/10)")).toBe("Undercode Day 2026");
    expect(stripDateFromTitle("Meetup (sáb 10/10)")).toBe("Meetup");
  });

  it("limpia filtros en la URL de agenda", () => {
    const href = agendaHref(
      {
        view: "lista",
        type: "evento",
        fav: true,
        bots: ["agenda"],
        month: "2026-10",
      },
      { type: undefined, fav: false, bots: [] },
    );
    expect(href).toBe("/agenda");
  });
});
