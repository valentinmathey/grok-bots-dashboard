import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parsePostDetails } from "./details";
import type { Post } from "./types";
import {
  asVuelo,
  countVuelosFilters,
  EMPTY_VUELOS_FILTERS,
  equipajeLabel,
  escalasLabel,
  formatVueloFechas,
  formatYmdDm,
  formatYmdMonth,
  matchesVuelosFilters,
  monthKey,
  normalizeVueloCategoria,
  sampleVueloDetails,
  sortVuelos,
  uniqueDestinos,
  uniqueMeses,
} from "./vuelos";

const base = sampleVueloDetails();

function post(details: unknown, id = "1"): Post {
  return {
    id,
    bot_id: "v",
    title: "Vuelo",
    body_markdown: "",
    kind: "vuelo",
    product: null,
    tags: [],
    created_at: "2026-11-25T12:00:00Z",
    details: details as Post["details"],
  };
}

describe("vuelo details", () => {
  it("acepta un payload completo al estilo del bot Vuelos", () => {
    const parsed = parsePostDetails("vuelo", base);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(asVuelo(parsed.details)?.destino).toBe("Buenos Aires (AEP)");
      expect(asVuelo(parsed.details)?.link).toContain("https://");
    }
  });

  it("acepta los 37 vuelos de la búsqueda del 25/11/2026", () => {
    const raw = JSON.parse(
      readFileSync("/workspace/vuelos/busqueda-2026-11-25.json", "utf8"),
    ) as { vuelos: unknown[] };
    expect(raw.vuelos).toHaveLength(37);
    const failed: string[] = [];
    for (const item of raw.vuelos) {
      const parsed = parsePostDetails("vuelo", item);
      if (!parsed.ok) {
        const destino =
          item && typeof item === "object" && "destino" in item
            ? String((item as { destino: unknown }).destino)
            : "?";
        failed.push(`${destino}: ${parsed.message}`);
      }
    }
    expect(failed).toEqual([]);
    const first = asVuelo(raw.vuelos[0]);
    expect(first?.origen).toBe("MDZ");
    expect(first?.categoria).toBe("más barato");
    expect(first?.escalas).toBe("Directo");
  });

  it("mapea aliases (duracion, source_url, moneda_original, slugs y escalas numéricas)", () => {
    const parsed = parsePostDetails("vuelo", {
      destino: "Punta Cana (PUJ)",
      origen: "SCL",
      aerolinea: "JetSMART",
      fecha_ida: "2027-01-12",
      fecha_vuelta: "2027-01-20",
      escalas: 1,
      escalas_detalle: "LIM",
      duracion: "Ida: 8h 30m",
      equipaje: { valija_despachada: false, costo_extra: 27.5, moneda: "USD" },
      precio_usd: 350,
      precio_original: 350,
      moneda_original: "USD",
      categoria: "mejor-equilibrio",
      source_url: "https://www.kayak.com/flights",
      fecha_busqueda: "2026-11-25",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const details = asVuelo(parsed.details);
    expect(details?.duracion_total).toBe("Ida: 8h 30m");
    expect(details?.link).toBe("https://www.kayak.com/flights");
    expect(details?.moneda).toBe("USD");
    expect(details?.categoria).toBe("mejor equilibrio");
    expect(details?.escalas).toBe("1 escala (LIM)");
    expect(details?.equipaje).toContain("27.5");
  });

  it("exige fields clave y enums válidos", () => {
    expect(parsePostDetails("vuelo", undefined).ok).toBe(false);
    expect(parsePostDetails("vuelo", { ...base, origen: "EZE" }).ok).toBe(false);
    expect(parsePostDetails("vuelo", { ...base, categoria: "premium" }).ok).toBe(false);
    expect(parsePostDetails("vuelo", { ...base, variacion: "cae" }).ok).toBe(false);
    expect(parsePostDetails("vuelo", { ...base, link: "ftp://x" }).ok).toBe(false);
    expect(parsePostDetails("vuelo", { ...base, fecha_vuelta: "2026-12-01" }).ok).toBe(false);
  });

  it("acepta ida sola y normaliza categorías con tilde o slug", () => {
    const { fecha_vuelta: _fv, variacion: _v, ...ida } = base;
    expect(parsePostDetails("vuelo", { ...ida, escalas: "Directo" }).ok).toBe(true);
    expect(normalizeVueloCategoria("más barato")).toBe("más barato");
    expect(normalizeVueloCategoria("mas-barato")).toBe("más barato");
    expect(normalizeVueloCategoria("Mejor Equilibrio")).toBe("mejor equilibrio");
  });

  it("acepta el mínimo: destino, origen, aerolínea, fecha de ida, precio y link", () => {
    const parsed = parsePostDetails("vuelo", {
      destino: "Punta Cana (PUJ)",
      origen: "SCL",
      aerolinea: "JetSMART",
      fecha_ida: "2027-01-12",
      precio_usd: 350,
      link: "https://www.kayak.com/flights",
    });
    expect(parsed.ok).toBe(true);
  });

  it("acepta 'sin confirmar' y el detalle opcional", () => {
    const parsed = parsePostDetails("vuelo", {
      destino: "Medellín (MDE)",
      origen: "MDZ",
      aerolinea: "Copa Airlines",
      fecha_ida: "2027-02-17",
      fecha_vuelta: "2027-02-25",
      escalas: "1 escala (PTY)",
      duracion_total: "sin confirmar",
      precio_usd: 820,
      precio_ars: 1200000,
      tipo_cambio: "sin confirmar",
      incluye_impuestos: "sin confirmar",
      incluye_percepciones: false,
      precio_total_ida_vuelta: 820,
      link: "https://www.copaair.com/en/flights-from-mendoza-to-medellin",
      sitio_compra: "Copa",
      low_cost: false,
      tarifa: {
        nombre: "Basic",
        cambios: "sin confirmar",
        reembolso: false,
        eleccion_asiento: "con cargo",
      },
      equipaje_detalle: {
        articulo_personal: true,
        carry_on: { incluido: true, peso_kg: 10, medidas: "sin confirmar" },
        valijas_despachadas: { cantidad: 1, kg: 23, incluida: false },
        costo_extra: 80,
        moneda: "USD",
      },
      conexiones: [
        {
          aeropuerto: "PTY",
          espera: "1h 05m",
          cambio_aeropuerto: false,
          cambio_terminal: "sin confirmar",
          visa_transito: "No",
        },
      ],
      tramos: [
        {
          numero_vuelo: "CM421",
          origen: "MDZ",
          destino: "PTY",
          salida: "14:30",
          llegada: "19:10",
          duracion: "5h 40m",
        },
        {
          numero_vuelo: "CM113",
          origen: "PTY",
          destino: "MDE",
          salida: "20:15",
          llegada: "21:20",
          duracion: "sin confirmar",
        },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const details = asVuelo(parsed.details);
    expect(details?.duracion_total).toBe("sin confirmar");
    expect(details?.tipo_cambio).toBe("sin confirmar");
    expect(details?.incluye_impuestos).toBe("sin confirmar");
    expect(details?.tarifa && typeof details.tarifa === "object" && details.tarifa.nombre).toBe("Basic");
    expect(details?.conexiones?.[0]?.aeropuerto).toBe("PTY");
    expect(details?.tramos).toHaveLength(2);
    expect(details?.equipaje_detalle?.carry_on && typeof details.equipaje_detalle.carry_on === "object").toBe(true);
  });
});

describe("vuelo labels y filtros", () => {
  it("formatea fechas dd/mm y meses sin desfasaje de zona", () => {
    expect(formatYmdDm("2026-12-15")).toBe("15/12");
    expect(formatVueloFechas(base)).toBe("10/12 – 18/12");
    expect(monthKey("2026-12-15")).toBe("2026-12");
    expect(formatYmdMonth("2026-12-15").toLowerCase()).toContain("dic");
    expect(formatYmdMonth("2026-12-15")).toContain("2026");
  });

  it("usa el texto de escalas y equipaje tal cual", () => {
    expect(escalasLabel(base)).toBe("Directo");
    expect(equipajeLabel(base)).toContain("valija");
  });

  it("filtra por destino, origen, mes y categoría, y ordena", () => {
    const cheapLater = post(
      {
        ...base,
        destino: "Cancún (CUN)",
        precio_usd: 120,
        fecha_ida: "2027-01-10",
        fecha_vuelta: "2027-01-20",
        categoria: "más barato",
        origen: "SCL",
      },
      "c",
    );
    const mid = post(base, "m");
    const posts = [mid, cheapLater];
    expect(uniqueDestinos(posts)).toEqual(["Buenos Aires (AEP)", "Cancún (CUN)"]);
    expect(uniqueMeses(posts)).toEqual(["2026-12", "2027-01"]);
    expect(
      matchesVuelosFilters(mid, { ...EMPTY_VUELOS_FILTERS, destinos: ["Buenos Aires (AEP)"] }),
    ).toBe(true);
    expect(
      matchesVuelosFilters(mid, { ...EMPTY_VUELOS_FILTERS, origenes: ["SCL"] }),
    ).toBe(false);
    expect(
      matchesVuelosFilters(cheapLater, { ...EMPTY_VUELOS_FILTERS, meses: ["2027-01"] }),
    ).toBe(true);
    expect(
      countVuelosFilters({
        ...EMPTY_VUELOS_FILTERS,
        destinos: ["A"],
        categorias: ["más barato"],
      }),
    ).toBe(2);
    expect(sortVuelos(posts, "precio").map((p) => p.id)).toEqual(["c", "m"]);
    expect(sortVuelos(posts, "fecha").map((p) => p.id)).toEqual(["m", "c"]);
  });
});
