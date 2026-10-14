import { describe, expect, it } from "vitest";
import { emptyResultLabel, resultCountLabel } from "@/lib/search-copy";

describe("textos del buscador", () => {
  it("cuenta resultados y arma el vacío", () => {
    expect(resultCountLabel(12, "x")).toBe("12 resultados para “x”");
    expect(resultCountLabel(1, "x")).toBe("1 resultado para “x”");
    expect(emptyResultLabel("x")).toBe("No encontramos nada para “x”");
  });
});
