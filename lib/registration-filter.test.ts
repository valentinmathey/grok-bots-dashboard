import { describe, expect, it } from "vitest";
import { filtersToSearchParams, parseFeedQuery } from "@/lib/filters";

describe("filtro inscripto", () => {
  it("parsea y serializa ?inscripto", () => {
    expect(parseFeedQuery({ inscripto: "si" }).registered).toBe("si");
    expect(parseFeedQuery({ inscripto: "no" }).registered).toBe("no");
    expect(parseFeedQuery({ inscripto: "x" }).registered).toBeUndefined();
    const q = parseFeedQuery({ inscripto: "no" });
    expect(filtersToSearchParams(q).get("inscripto")).toBe("no");
  });
});
