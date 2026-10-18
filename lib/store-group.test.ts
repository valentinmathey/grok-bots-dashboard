import { describe, expect, it } from "vitest";
import { storeGroupName } from "@/lib/store-group";

describe("storeGroupName", () => {
  it("agrupa variantes de la misma tienda", () => {
    expect(storeGroupName("Mercado Libre")).toBe("Mercado Libre");
    expect(storeGroupName("Mercado Libre · Tienda oficial Logitech")).toBe(
      "Mercado Libre",
    );
    expect(storeGroupName("MercadoLibre - vendedor Top")).toBe("Mercado Libre");
    expect(storeGroupName("Frávega")).toBe("Frávega");
    expect(storeGroupName("Fravega online")).toBe("Frávega");
    expect(storeGroupName("Logitech Store (oficial)")).toBe("Logitech Store");
    expect(storeGroupName("Compra Gamer")).toBe("Compra Gamer");
  });
});
