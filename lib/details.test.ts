import { describe, expect, it } from "vitest";
import { asAlojamiento, parsePostDetails } from "@/lib/details";

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
