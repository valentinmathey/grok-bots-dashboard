import { describe, expect, it } from "vitest";
import {
  asAlojamiento,
  asOportunidades,
  parsePostDetails,
} from "@/lib/details";
import { asNewsletter, asRanking, asWorkflow } from "@/lib/rich-details";

describe("details de alojamiento", () => {
  it("acepta el schema y completa maps_url", () => {
    const parsed = parsePostDetails("alojamiento", {
      platform: "airbnb",
      city: "Florianópolis",
      lat: -27.6,
      lng: -48.5,
      score: 8.5,
      price_per_person: 400,
      amenities: ["Pool", "wifi"],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const details = asAlojamiento(parsed.details);
    expect(details?.maps_url).toContain("-27.6,-48.5");
    expect(details?.amenities).toEqual(["pool", "wifi"]);
  });

  it("rechaza un score fuera de rango", () => {
    expect(parsePostDetails("alojamiento", { score: 12 }).ok).toBe(false);
  });
});

describe("details de oportunidades", () => {
  const item = {
    name: "ETHGlobal Buenos Aires",
    url: "https://ethglobal.com/events/buenosaires",
    category: "hackaton",
    organization: "ETHGlobal",
    prize_text: "US$ 100k",
    prize_value: 100000,
    prize_currency: "USD",
    deadline: "2026-10-20",
    recommended: true,
  };

  it("acepta el schema, normaliza deadline y descarta claves desconocidas", () => {
    const parsed = parsePostDetails("oportunidades", {
      period_label: "Martes 13/10",
      extra_key: "fuera",
      items: [{ ...item, foo: 1 }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const details = asOportunidades(parsed.details);
    expect(details?.period_label).toBe("Martes 13/10");
    expect(details?.items).toHaveLength(1);
    expect(details?.items[0]?.deadline).toBe("2026-10-20T03:00:00.000Z");
    expect(details?.items[0]).not.toHaveProperty("foo");
    expect(parsed.details).not.toHaveProperty("extra_key");
  });

  it("exige items y rechaza categoría o URL inválidas", () => {
    expect(parsePostDetails("oportunidades", undefined).ok).toBe(false);
    expect(parsePostDetails("oportunidades", { items: [] }).ok).toBe(false);
    expect(
      parsePostDetails("oportunidades", {
        items: [{ ...item, category: "fiesta" }],
      }).ok,
    ).toBe(false);
    expect(
      parsePostDetails("oportunidades", {
        items: [{ ...item, url: "ftp://no.com" }],
      }).ok,
    ).toBe(false);
  });
});

describe("details de ranking / newsletter / informe / workflow", () => {
  it("valida ranking y acepta report con forma de ranking", () => {
    const details = {
      product_name: "Logitech Z407",
      currency: "ARS",
      extra: "fuera",
      offers: [
        { store: "Mexx", url: "https://www.mexx.com.ar/z407", price: 184900.9 },
      ],
      previous_best_price: 210000,
    };
    const ranking = parsePostDetails("ranking", details);
    expect(ranking.ok).toBe(true);
    if (!ranking.ok) return;
    expect(ranking.details).not.toHaveProperty("extra");
    expect(asRanking(ranking.details)?.product_name).toBe("Logitech Z407");

    const asReport = parsePostDetails("report", details);
    expect(asReport.ok).toBe(true);
    expect(parsePostDetails("ranking", { product_name: "" }).ok).toBe(false);
    expect(parsePostDetails("report", { title: "informe viejo" }).ok).toBe(true);
  });

  it("valida newsletter y deja vacío como card estándar", () => {
    const parsed = parsePostDetails("newsletter", {
      headline: "IA de la semana",
      tldr: ["OpenAI bajó precios"],
      leftover: true,
      sections: [{ title: "IA", icon: "ai", items: [{ title: "Nota" }] }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.details).not.toHaveProperty("leftover");
    expect(asNewsletter(parsed.details)?.headline).toBe("IA de la semana");
    expect(asNewsletter({})).toBeNull();
    expect(parsePostDetails("newsletter", {}).ok).toBe(true);
  });

  it("valida informe y rechaza un indicador sin value", () => {
    const parsed = parsePostDetails("informe", {
      date: "2026-10-10",
      brecha_pct: 28.4,
      indicators: [{ key: "dolar_blue", value: 1480, unit: "ARS", direction: "up" }],
    });
    expect(parsed.ok).toBe(true);
    expect(
      parsePostDetails("informe", {
        indicators: [{ key: "dolar_blue" }],
      }).ok,
    ).toBe(false);
  });

  it("valida workflow y exige workflow_name", () => {
    const parsed = parsePostDetails("workflow", {
      workflow_name: "Digest Telegram",
      status: "active",
      trigger_type: "schedule",
      services: ["telegram", "openai"],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(asWorkflow(parsed.details)?.workflow_name).toBe("Digest Telegram");
    expect(parsePostDetails("workflow", { status: "active" }).ok).toBe(false);
    expect(asWorkflow({})).toBeNull();
  });
});
