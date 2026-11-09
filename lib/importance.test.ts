import { describe, expect, it } from "vitest";
import {
  buyBeforeLabel,
  matchesImportance,
  parseImportanceList,
  readImportance,
} from "./importance";
import { parsePostDetails } from "./details";
import payloads from "@/docs/mendoza-payloads.json";

describe("importance", () => {
  it("lee level, reason y buy_before", () => {
    expect(
      readImportance({
        importance: "imperdible",
        importance_reason: "Única fecha",
        buy_before: "2026-11-12",
      }),
    ).toEqual({
      level: "imperdible",
      reason: "Única fecha",
      buyBefore: "2026-11-12",
    });
    expect(readImportance({ importance: "raro" }).level).toBeNull();
    expect(buyBeforeLabel("2026-11-12")).toBe("Comprar antes del 12/11");
  });

  it("filtra multi-select y exige importance si hay filtro", () => {
    expect(matchesImportance({}, ["imperdible"])).toBe(false);
    expect(matchesImportance({ importance: "bueno" }, ["imperdible", "bueno"])).toBe(true);
    expect(matchesImportance({ importance: "normal" }, [])).toBe(true);
    expect(parseImportanceList("imperdible,bueno,foo")).toEqual(["imperdible", "bueno"]);
  });

  it("schemas de eventos aceptan los campos", () => {
    const ok = parsePostDetails("evento", {
      status: "activo",
      importance: "destacado",
      importance_reason: "Buen lineup",
      buy_before: "2026-11-15",
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect((ok.details as Record<string, unknown>).importance).toBe("destacado");
      expect((ok.details as Record<string, unknown>).buy_before).toBe("2026-11-15");
    }
    expect(parsePostDetails("evento", { importance: "mega" }).ok).toBe(false);
    expect(parsePostDetails("evento", { buy_before: "18/11/2026" }).ok).toBe(false);

    for (const kind of ["evento-mza", "gastro", "recital"] as const) {
      const base = (payloads as Record<string, { details: Record<string, unknown> }>)[kind].details;
      const parsed = parsePostDetails(kind, {
        ...base,
        importance: "imperdible",
        importance_reason: "No te lo pierdas",
        buy_before: "2026-12-01",
      });
      expect(parsed.ok).toBe(true);
      if (parsed.ok) {
        expect((parsed.details as Record<string, unknown>).importance).toBe("imperdible");
      }
      expect(
        parsePostDetails(kind, { ...base, importance_reason: "x".repeat(121) }).ok,
      ).toBe(false);
    }
  });
});
