import { describe, expect, it } from "vitest";
import { rankingSections, type RankingDetails } from "@/lib/rich-details";

const o = (
  store: string,
  price: number,
  inst?: { count: number; total?: number; interest_free?: boolean },
  in_stock = true,
) => ({
  store,
  url: `https://x.test/${store}`,
  price,
  in_stock,
  ...(inst ? { installments: inst } : {}),
});

describe("rankingSections", () => {
  it("arma los 3 apartados", () => {
    const details = {
      product_name: "Z407",
      offers: [
        o("A", 100),
        o("B", 90, { count: 3, total: 95, interest_free: true }),
        o("C", 110, { count: 12, total: 120, interest_free: true }),
        o("D", 80, undefined, false),
        o("E", 105, { count: 6, total: 105, interest_free: true }),
        o("F", 95, { count: 2, total: 95, interest_free: true }),
        o("G", 99, { count: 18, total: 140, interest_free: false }),
      ],
    } as unknown as RankingDetails;
    const s = rankingSections(details);
    expect(s.contado.map((x) => x.store)).toEqual(["B", "F", "G", "A", "E"]);
    expect(s.cuotasTotal.map((x) => x.store)).toEqual(["B", "E", "C"]);
    expect(s.masCuotas.map((x) => x.store)).toEqual(["C", "E", "B", "F"]);
  });
});
