import { describe, expect, it } from "vitest";
import {
  hasPriceDrop,
  parsePostDetails,
  asAlojamiento,
} from "@/lib/details";

describe("details de posts", () => {
  it("valida un alojamiento y completa maps_url", () => {
    const parsed = parsePostDetails("alojamiento", {
      platform: "airbnb",
      city: "Florianópolis",
      lat: -27.6,
      lng: -48.5,
      score: 8.5,
      amenities: ["Pool", "wifi", "pool"],
      listing_url: "",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const details = asAlojamiento(parsed.details);
    expect(details?.maps_url).toContain("-27.6,-48.5");
    expect(details?.amenities).toEqual(["pool", "wifi"]);
    expect(details?.listing_url).toBeUndefined();
  });

  it("rechaza un score inválido en alojamiento", () => {
    const parsed = parsePostDetails("alojamiento", { score: 12 });
    expect(parsed.ok).toBe(false);
  });

  it("valida un resumen con week_key ISO", () => {
    const parsed = parsePostDetails("resumen", {
      week_key: "2026-W41",
      period_from: "2026-10-03",
      period_to: "2026-10-10",
      generated_at: "2026-10-10T11:00:00.000Z",
      bots: [
        {
          bot_id: "bot_1",
          name: "Hospedajes",
          slug: "hospedajes",
          new_posts: 2,
        },
      ],
    });
    expect(parsed.ok).toBe(true);
  });

  it("deja details libres en kinds desconocidos y rechaza arrays", () => {
    expect(parsePostDetails("release", { foo: 1, bar: "ok" }).ok).toBe(true);
    expect(parsePostDetails("release", [1, 2]).ok).toBe(false);
  });

  it("detecta una baja de precio", () => {
    expect(
      hasPriceDrop({
        price_per_person: 400,
        previous_price_per_person: 520,
      }),
    ).toBe(true);
    expect(hasPriceDrop({ price_total: 100, previous_price_total: 90 })).toBe(
      false,
    );
  });
});
