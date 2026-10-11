import { describe, expect, it } from "vitest";
import {
  findTechnicalBlock,
  informeLead,
  inflationLineAmount,
  leftoverTechnicalBlocks,
  moneyActions,
  parseAgendaFallback,
  parseTasasRows,
  parseTechnicalBlocks,
  sortRatesByMonthly,
} from "@/lib/informe";
import { asInforme } from "@/lib/rich-details";

describe("informe helpers", () => {
  it("parte el técnico en bloques por heading en negrita", () => {
    const blocks = parseTechnicalBlocks(
      "**Dólar:** blue $1540. **Inflación:** 1,7% m/m. **Tasas:** PF Nación 19,25% / 1,58% · Mercado Pago 18,6% / 1,54%. **Agenda:** lun 12 feriado · mar 13 IPC",
    );
    expect(findTechnicalBlock(blocks, "dolar")?.body).toContain("1540");
    expect(findTechnicalBlock(blocks, "inflacion")?.body).toContain("1,7%");
    expect(parseTasasRows(findTechnicalBlock(blocks, "tasas")?.body ?? "")).toEqual([
      { entity: "PF Nación", tna: "19,25%", monthly: "1,58%" },
      { entity: "Mercado Pago", tna: "18,6%", monthly: "1,54%" },
    ]);
    expect(parseAgendaFallback(findTechnicalBlock(blocks, "agenda")?.body ?? "")).toEqual([
      { label: "lun 12", title: "feriado" },
      { label: "mar 13", title: "IPC" },
    ]);
    expect(leftoverTechnicalBlocks(blocks)).toEqual([]);
  });

  it("arma el lead y las acciones sin inventar texto", () => {
    const details = asInforme({
      dia_en_3_lineas: { lines: ["Blue abajo", "MEP pegado"] },
      idea_prudente: { title: "Corto", text: "Liquidez.", risk: "bajo" },
      vs_inflacion: {
        verdict: "si",
        example_amount: 100,
        inflation_pct: 2,
        options: [{ name: "LECAP", monthly_rate_pct: 1.9, result_amount: 101.9 }],
      },
    });
    expect(details).not.toBeNull();
    if (!details) return;
    expect(informeLead(details)).toBe("Blue abajo MEP pegado");
    expect(moneyActions(details)[0]).toContain("Corto");
    expect(inflationLineAmount(100, 2)).toBe(102);
  });

  it("ordena tasas por rendimiento mensual", () => {
    const rows = sortRatesByMonthly([
      {
        instrument: "PF",
        provider: "A",
        tna_pct: 18,
        monthly_pct: 1.4,
        beats_inflation: false,
        risk: "bajo",
      },
      {
        instrument: "LECAP",
        provider: "B",
        tna_pct: 23,
        monthly_pct: 1.9,
        beats_inflation: true,
        risk: "medio",
      },
    ]);
    expect(rows[0]?.instrument).toBe("LECAP");
  });
});
