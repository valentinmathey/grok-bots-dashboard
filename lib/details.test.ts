import { describe, expect, it } from "vitest";
import {
  asAlojamiento,
  asOportunidades,
  parsePostDetails,
} from "@/lib/details";

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
