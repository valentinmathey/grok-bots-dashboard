import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { FilterToolbar } from "@/components/FilterToolbar";

describe("FilterToolbar", () => {
  it("muestra principal, badge y chips activos removibles", () => {
    const html = renderToStaticMarkup(
      createElement(
        FilterToolbar,
        {
          applied: 2,
          primary: createElement("span", null, "ORDEN"),
          clearHref: "/x",
          activeChips: [{ label: "Bot A", removeHref: "/x?k=1" }],
          children: createElement("span", null, "CHIPS"),
        },
      ),
    );
    expect(html).toContain("ORDEN");
    expect(html).toContain("Filtros, 2 activos");
    expect(html).toContain('href="/x?k=1"');
    expect(html).toContain("CHIPS");
  });
});
