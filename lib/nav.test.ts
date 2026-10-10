import { describe, expect, it } from "vitest";
import { isMoreRoute, primaryTabFromPathname, titleFromPathname } from "@/lib/nav";

describe("pestañas principales", () => {
  it("mapea cada ruta al tab de la barra", () => {
    expect(primaryTabFromPathname("/")).toBe("inicio");
    expect(primaryTabFromPathname("/agenda")).toBe("agenda");
    expect(primaryTabFromPathname("/buscar?q=hola")).toBe("buscar");
    expect(primaryTabFromPathname("/favoritos")).toBe("guardados");
    expect(primaryTabFromPathname("/pedidos/abc")).toBe("mas");
    expect(primaryTabFromPathname("/estadisticas")).toBe("mas");
    expect(primaryTabFromPathname("/notificaciones")).toBe("mas");
    expect(primaryTabFromPathname("/ajustes")).toBe("mas");
    expect(primaryTabFromPathname("/bots/nuevo")).toBe("mas");
    expect(primaryTabFromPathname("/bots/reportero")).toBe("inicio");
  });

  it("marca Más en las rutas secundarias", () => {
    expect(isMoreRoute("/pedidos")).toBe(true);
    expect(isMoreRoute("/")).toBe(false);
    expect(titleFromPathname("/agenda")).toBe("Agenda");
    expect(titleFromPathname("/favoritos")).toBe("Guardados");
  });
});
