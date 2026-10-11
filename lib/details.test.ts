import { describe, expect, it } from "vitest";
import {
  asAlojamiento,
  asOportunidades,
  parsePostDetails,
} from "@/lib/details";
import {
  asInforme,
  asNewsletter,
  asRanking,
  asWorkflow,
  rankingBestCardOffer,
  rankingBestOffer,
} from "@/lib/rich-details";

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

  it("marca la mejor oferta en efectivo y la de tarjeta según el veredicto", () => {
    const details = asRanking({
      product_name: "Logitech Z407",
      currency: "ARS",
      best_offer_index: 0,
      verdict:
        "Mexx tiene el mejor precio en efectivo. Si pagás con tarjeta, conviene Compumundo.",
      offers: [
        { store: "Mexx", url: "https://www.mexx.com.ar/z407", price: 184900 },
        {
          store: "Compumundo",
          url: "https://www.compumundo.com.ar/z407",
          price: 198499,
          installments_text: "6 cuotas sin interés",
        },
      ],
    });
    expect(rankingBestOffer(details!)?.store).toBe("Mexx");
    expect(rankingBestCardOffer(details!)?.store).toBe("Compumundo");
    expect(
      rankingBestCardOffer({
        ...details!,
        verdict: "Mexx es la compra.",
      }),
    ).toBeNull();
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
      leftover: true,
      indicators: [{ key: "dolar_blue", value: 1480, unit: "ARS", direction: "up" }],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.details).not.toHaveProperty("leftover");
    expect(asInforme(parsed.details)?.indicators).toHaveLength(1);
    expect(
      parsePostDetails("informe", {
        indicators: [{ key: "dolar_blue" }],
      }).ok,
    ).toBe(false);
  });

  it("acepta secciones nuevas opcionales del informe y hasta 40 fuentes", () => {
    const parsed = parsePostDetails("informe", {
      date: "2026-10-10",
      dia_en_3_lineas: { lines: ["Blue abajo", "MEP pegado", "PF pierde"] },
      dolar_simple: { text: "El blue aflojó." },
      vs_inflacion: {
        verdict: "si",
        example_amount: 1_000_000,
        inflation_pct: 1.7,
        options: [{ name: "LECAP", monthly_rate_pct: 1.93, result_amount: 1_019_300 }],
      },
      idea_prudente: { title: "Corto", text: "Liquidez.", risk: "bajo" },
      tecnica_sueldo: {
        name: "50/30/20",
        description: "Reparto simple",
        allocation: [
          { label: "Gastos", pct: 50 },
          { label: "Ocio", pct: 30 },
          { label: "Ahorro", pct: 20 },
        ],
      },
      referentes: [
        {
          name: "REM",
          platform: "nota",
          summary: "Esperan 1,9%.",
          date: "2026-10-10",
          url: "https://www.bcra.gob.ar",
        },
      ],
      palabra_del_dia: { term: "Brecha", definition: "Oficial vs MEP." },
      inflation: {
        month: "Agosto",
        monthly_pct: 1.7,
        yoy_pct: 33.5,
        ytd_pct: 21.4,
        next_release_date: "2026-10-13",
      },
      rates: [
        {
          instrument: "PF",
          provider: "Nación",
          tna_pct: 19.25,
          monthly_pct: 1.58,
          risk: "bajo",
        },
      ],
      ideas: [
        {
          name: "LECAP",
          what_it_is: "Letra del Tesoro",
          profile: "conservador",
          risk: "medio",
          how_to: "Licitación del miércoles",
        },
      ],
      assets: [
        {
          ticker: "AL30",
          name: "Bonar 2030",
          type: "bono",
          price: 86.6,
          currency: "USD",
          change_pct: 0.4,
        },
      ],
      agenda: [{ date: "2026-10-13", title: "IPC septiembre" }],
      otras_secciones: [{ titulo: "Nota", markdown: "Techo de banda." }],
      sources: Array.from({ length: 25 }, (_, index) => ({
        name: `Fuente ${index + 1}`,
        url: index % 2 === 0 ? `https://example.com/${index}` : undefined,
        section: index === 0 ? "rates" : undefined,
      })),
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const details = asInforme(parsed.details);
    expect(details?.dia_en_3_lineas?.lines).toHaveLength(3);
    expect(details?.rates?.[0]?.provider).toBe("Nación");
    expect(details?.referentes?.[0]?.platform).toBe("nota");
    expect(details?.sources).toHaveLength(25);
    expect(details?.sources?.[0]?.section).toBe("rates");
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
