import { describe, expect, it } from "vitest";
import { markdownExcerpt } from "@/lib/excerpt";

describe("markdownExcerpt", () => {
  it("saca markdown y recorta", () => {
    expect(markdownExcerpt("# Hola\n\n**Qué** cambió: [link](https://x.y) y `code`")).toBe(
      "Hola Qué cambió: link y code",
    );
    const long = markdownExcerpt("palabra ".repeat(100), 40);
    expect(long.endsWith("…")).toBe(true);
    expect(long.length).toBeLessThanOrEqual(41);
    expect(markdownExcerpt(null)).toBe("");
  });
});
