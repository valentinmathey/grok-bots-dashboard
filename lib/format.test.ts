import { describe, expect, it } from "vitest";
import {
  botCardLead,
  formatPublicationCount,
} from "@/lib/format";

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
