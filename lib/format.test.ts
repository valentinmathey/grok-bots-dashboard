import { describe, expect, it } from "vitest";
import {
  botCardLead,
  formatDateTime,
  formatEventWhen,
  formatPublicationCount,
} from "@/lib/format";

describe("formatDateTime", () => {
  it("no usa espacios de no-separación (evita mismatch de hidratación)", () => {
    const text = formatDateTime("2026-10-08T10:00:00.000Z");
    expect(text).not.toMatch(/[\u00a0\u202f\u2007\u2009]/);
    expect(text).toMatch(/2026/);
  });
});

describe("formatEventWhen", () => {
  it("formatea día y hora en español de Argentina", () => {
    const text = formatEventWhen("2026-10-13T22:00:00.000Z");
    expect(text).toMatch(/13/);
    expect(text).toMatch(/oct/i);
    expect(text).toMatch(/19:00/);
    expect(text).not.toMatch(/[\u00a0\u202f\u2007\u2009]/);
  });

  it("acorta un rango del mismo día a una sola fecha", () => {
    const text = formatEventWhen(
      "2026-10-13T16:00:00.000Z",
      "2026-10-13T17:00:00.000Z",
    );
    expect(text).toMatch(/13:00–14:00/);
    expect(text).not.toMatch(/– mar/);
  });
});

describe("formatPublicationCount", () => {
  it("usa singular y plural en español", () => {
    expect(formatPublicationCount(0)).toBe("0 publicaciones");
    expect(formatPublicationCount(1)).toBe("1 publicación");
    expect(formatPublicationCount(32)).toBe("32 publicaciones");
  });
});

describe("botCardLead", () => {
  it("prioriza el estado cuando existe", () => {
    expect(
      botCardLead({
        status: "Buscando precios",
        post_count: 1,
        latest_title: "Logitech Z407",
      }),
    ).toEqual({
      tone: "live",
      label: null,
      text: "Buscando precios",
    });
  });

  it("muestra el título de la última publicación si no hay estado", () => {
    expect(
      botCardLead({
        status: null,
        post_count: 1,
        latest_title: "Comprar los parlantes Logitech Z407 nuevos en Argentina",
      }),
    ).toEqual({
      tone: "latest",
      label: "Última publicación",
      text: "Comprar los parlantes Logitech Z407 nuevos en Argentina",
    });
  });

  it("no dice que está vacío cuando hay publicaciones", () => {
    const lead = botCardLead({
      status: "   ",
      post_count: 1,
      latest_title: "Un post",
    });
    expect(lead.tone).toBe("latest");
    expect(lead.text).not.toMatch(/sin estado|todavía no/i);
  });

  it("muestra el próximo evento si no hay estado", () => {
    expect(
      botCardLead({
        status: null,
        post_count: 3,
        latest_title: "Otra cosa",
        next_event_title: "Demo con el dueño",
        next_event_at: "2026-10-13T22:00:00.000Z",
      }),
    ).toEqual({
      tone: "event",
      label: "Próximo evento",
      text: "Demo con el dueño",
    });
  });

  it("solo marca vacío si no hay posts ni estado", () => {
    expect(
      botCardLead({
        status: null,
        post_count: 0,
        latest_title: null,
      }),
    ).toEqual({
      tone: "empty",
      label: null,
      text: "Todavía no publicó",
    });
  });
});
