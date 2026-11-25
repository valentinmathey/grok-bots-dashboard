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
  effectiveVuelosEstados,
  isDefaultVuelosEstados,
  normalizeVueloEstado,
  vueloEstado,
  parseVuelosFilters,
  pickAerolineaFicha,
  uniqueAerolineas,
  airlineKeys,
  airlineLabel,
  stripAirlineDecorations,
  uniqueDestinos,
  uniqueMeses,
  vuelosHref,
  VUELO_DETAILS_MAX_CHARS,
  VUELO_TEXT_MAX,
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
    expect(first?.categoria).toBe("mas-barato");
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
    expect(details?.categoria).toBe("equilibrado");
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
    expect(normalizeVueloCategoria("más barato")).toBe("mas-barato");
    expect(normalizeVueloCategoria("mas-barato")).toBe("mas-barato");
    expect(normalizeVueloCategoria("Mejor Equilibrio")).toBe("equilibrado");
    expect(normalizeVueloCategoria("mejor-equilibrio")).toBe("equilibrado");
    expect(normalizeVueloCategoria("más rápido")).toBe("mas-rapido");
    expect(parsePostDetails("vuelo", { ...base, categoria: "mejor-equilibrio" }).ok).toBe(true);
    const saved = parsePostDetails("vuelo", { ...base, categoria: "mejor equilibrio" });
    expect(saved.ok && asVuelo(saved.details)?.categoria).toBe("equilibrado");
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
        categoria: "mas-barato",
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
        categorias: ["mas-barato"],
      }),
    ).toBe(2);
    expect(sortVuelos(posts, "precio").map((p) => p.id)).toEqual(["c", "m"]);
    expect(sortVuelos(posts, "fecha").map((p) => p.id)).toEqual(["m", "c"]);
  });
});

describe("límites de texto de vuelo", () => {
  it("acepta textos de 1000 caracteres y no los recorta", () => {
    const longText = "x".repeat(VUELO_TEXT_MAX);
    const parsed = parsePostDetails("vuelo", {
      destino: "Punta Cana (PUJ)",
      origen: "SCL",
      aerolinea: "JetSMART",
      fecha_ida: "2027-01-12",
      precio_usd: 350,
      link: "https://www.kayak.com/flights",
      equipaje: longText,
      notas: longText,
      tarifa: {
        nombre: longText,
        cambios: longText,
        reembolso: longText,
        eleccion_asiento: longText,
      },
      equipaje_detalle: {
        articulo_personal: longText,
        carry_on: longText,
        valijas_despachadas: longText,
        costo_extra: longText,
      },
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const details = asVuelo(parsed.details);
    expect(details?.equipaje).toBe(longText);
    expect(details?.notas).toBe(longText);
    expect(details?.tarifa && typeof details.tarifa === "object" && details.tarifa.cambios).toBe(longText);
    expect(details?.equipaje_detalle?.articulo_personal).toBe(longText);
  });

  it("si se pasa del límite, falla con error claro y no recorta", () => {
    const tooLong = "y".repeat(VUELO_TEXT_MAX + 1);
    const parsed = parsePostDetails("vuelo", {
      destino: "Punta Cana (PUJ)",
      origen: "SCL",
      aerolinea: "JetSMART",
      fecha_ida: "2027-01-12",
      precio_usd: 350,
      link: "https://www.kayak.com/flights",
      equipaje: tooLong,
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.message.toLowerCase()).toContain("válidos");
    const issues = JSON.stringify(parsed.issues ?? []);
    expect(issues).toContain(String(VUELO_TEXT_MAX));
    expect(issues.toLowerCase()).toContain("no se recorta");
  });

  it("rechaza details que superan el tope total, sin recortar", () => {
    const blob = "z".repeat(VUELO_TEXT_MAX);
    const parsed = parsePostDetails("vuelo", {
      destino: "Punta Cana (PUJ)",
      origen: "SCL",
      aerolinea: "JetSMART",
      fecha_ida: "2027-01-12",
      precio_usd: 350,
      link: "https://www.kayak.com/flights",
      notas: blob,
      equipaje: blob,
      escalas: blob,
      duracion_total: blob,
      tramos: Array.from({ length: 12 }, (_, i) => ({
        numero_vuelo: `XX${i}`,
        duracion: blob,
        salida: blob,
        llegada: blob,
      })),
      conexiones: Array.from({ length: 8 }, (_, i) => ({
        aeropuerto: `XX${i}`,
        espera: blob,
        visa_transito: blob,
        cambio_aeropuerto: blob,
        cambio_terminal: blob,
      })),
    });
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    const issues = JSON.stringify(parsed.issues ?? parsed.message);
    expect(issues).toContain(String(VUELO_DETAILS_MAX_CHARS));
    expect(issues.toLowerCase()).toContain("no se recorta");
  });
});

describe("aerolínea normalizada y ficha", () => {
  const airlinePayload = {
    ...base,
    aerolinea: "Aerolíneas Argentinas",
    aerolinea_nombre: "Aerolíneas Argentinas",
    aerolinea_iata: "ar",
    aerolinea_info: {
      tipo: "full service",
      alianza: "SkyTeam",
      equipaje_estandar: {
        mochila: { incluido: true, kg: 10, texto: "bajo el asiento" },
        carry_on: { incluido: true, kg: 8 },
        valija_despachada: { incluido: false, kg: 23, texto: "sin confirmar" },
      },
      puntualidad: { valor: "82%", fuente: "OAG 2026", url: "https://www.oag.com/on-time" },
      reputacion: "sin confirmar",
      politica_equipaje: "https://www.aerolineas.com.ar/equipaje",
      fuentes: [
        { nombre: "Sitio oficial", url: "https://www.aerolineas.com.ar" },
        "https://www.iata.org",
      ],
    },
    tramos: [
      {
        numero_vuelo: "AR1651",
        origen: "MDZ",
        destino: "AEP",
        codeshare: true,
        operador: "Austral",
        operador_iata: "AU",
      },
    ],
  };

  it("acepta ficha, IATA, sin confirmar, codeshare y aliases", () => {
    const parsed = parsePostDetails("vuelo", airlinePayload);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const details = asVuelo(parsed.details);
    expect(details?.aerolinea_iata).toBe("AR");
    expect(details?.aerolinea_info?.tipo).toBe("tradicional");
    expect(details?.aerolinea_info?.equipaje_estandar && typeof details.aerolinea_info.equipaje_estandar === "object").toBe(true);
    const bag =
      details?.aerolinea_info?.equipaje_estandar &&
      typeof details.aerolinea_info.equipaje_estandar === "object"
        ? details.aerolinea_info.equipaje_estandar
        : null;
    expect(bag && "valija" in bag).toBe(true);
    expect(details?.aerolinea_info?.politica_equipaje_url).toBe(
      "https://www.aerolineas.com.ar/equipaje",
    );
    expect(details?.aerolinea_info?.reputacion).toBe("sin confirmar");
    expect(details?.tramos?.[0]?.codeshare).toBe(true);
    expect(details?.tramos?.[0]?.operador_iata).toBe("AU");
  });

  it("acepta aerolinea como objeto y no rompe posts viejos", () => {
    const asObject = parsePostDetails("vuelo", {
      ...base,
      aerolinea: { nombre: "Copa Airlines", iata: "CM", info: { tipo: "tradicional", alianza: "Star Alliance" } },
    });
    expect(asObject.ok).toBe(true);
    if (asObject.ok) {
      const details = asVuelo(asObject.details);
      expect(details?.aerolinea).toBe("Copa Airlines");
      expect(details?.aerolinea_iata).toBe("CM");
      expect(details?.aerolinea_info?.alianza).toBe("Star Alliance");
    }
    const legacy = parsePostDetails("vuelo", base);
    expect(legacy.ok).toBe(true);
    if (legacy.ok) {
      expect(asVuelo(legacy.details)?.aerolinea_info).toBeUndefined();
      expect(asVuelo(legacy.details)?.aerolinea).toBe("Aerolíneas Argentinas");
    }
  });

  it("agrupa por IATA o nombre normalizado, filtra y arma la URL", () => {
    const ar1 = post({ ...airlinePayload, destino: "Buenos Aires (AEP)" }, "ar1");
    const ar2 = post(
      { ...base, aerolinea: "Aerolineas Argentinas", aerolinea_iata: "AR", destino: "Córdoba (COR)" },
      "ar2",
    );
    ar2.created_at = "2026-11-26T12:00:00Z";
    const jet = post({ ...base, aerolinea: "JetSMART", destino: "Santiago (SCL)" }, "jet");
    const options = uniqueAerolineas([ar1, ar2, jet]);
    expect(options.map((item) => item.key).sort()).toEqual(["AR", "AU", "JA"]);
    expect(options.find((item) => item.key === "AR")?.label).toBe("Aerolíneas Argentinas (AR)");
    expect(options.find((item) => item.key === "JA")?.label).toBe("JetSMART (JA)");
    expect(options.every((item) => !/\d{2,4}/.test(item.label.replace(/\([A-Z0-9]{2,3}\)/, "")))).toBe(true);
    expect(matchesVuelosFilters(ar1, { ...EMPTY_VUELOS_FILTERS, aerolineas: ["AR"] })).toBe(true);
    expect(matchesVuelosFilters(jet, { ...EMPTY_VUELOS_FILTERS, aerolineas: ["AR"] })).toBe(false);
    expect(matchesVuelosFilters(jet, { ...EMPTY_VUELOS_FILTERS, aerolineas: ["JA"] })).toBe(true);
    expect(matchesVuelosFilters(jet, { ...EMPTY_VUELOS_FILTERS, aerolineas: ["jetsmart"] })).toBe(true);
    expect(countVuelosFilters({ ...EMPTY_VUELOS_FILTERS, aerolineas: ["AR", "jetsmart"] })).toBe(2);

    const parsed = parseVuelosFilters({
      destino: "Buenos Aires (AEP)",
      origen: "MDZ",
      aerolinea: "AR,jetsmart",
      sort: "fecha",
    });
    expect(parsed.aerolineas).toEqual(["AR", "jetsmart"]);
    expect(parsed.origenes).toEqual(["MDZ"]);
    expect(parsed.sort).toBe("fecha");
    const href = vuelosHref(parsed);
    expect(href).toContain("/bots/vuelos?");
    expect(href).toContain("aerolinea=AR%2Cjetsmart");
    expect(href).toContain("sort=fecha");
  });

  it("toma la ficha del post más reciente que la tenga", () => {
    const oldWithInfo = post({ ...airlinePayload, aerolinea_info: { tipo: "tradicional", alianza: "SkyTeam" } }, "old");
    oldWithInfo.created_at = "2026-11-01T12:00:00Z";
    const newerWithout = post({ ...base, aerolinea: "Aerolíneas Argentinas", aerolinea_iata: "AR" }, "new");
    newerWithout.created_at = "2026-11-20T12:00:00Z";
    const newestWithInfo = post(
      { ...airlinePayload, aerolinea_info: { tipo: "tradicional", alianza: "SkyTeam", puntualidad: "84%" } },
      "newest",
    );
    newestWithInfo.created_at = "2026-11-24T12:00:00Z";
    const ficha = pickAerolineaFicha([oldWithInfo, newerWithout, newestWithInfo], "AR");
    expect(ficha?.postId).toBe("newest");
    expect(ficha?.info && "puntualidad" in ficha.info ? ficha.info.puntualidad : null).toBe("84%");

    const skippedNewer = pickAerolineaFicha([oldWithInfo, newerWithout], "AR");
    expect(skippedNewer?.postId).toBe("old");
    expect(skippedNewer?.info && "alianza" in skippedNewer.info ? skippedNewer.info.alianza : null).toBe("SkyTeam");
  });
});

describe("filtro de aerolíneas sin número de vuelo", () => {
  it("acepta aerolinea_normalizada y no exige republicar el texto de aerolinea", () => {
    const parsed = parsePostDetails("vuelo", {
      ...base,
      aerolinea: "JetSMART (JA7730/JA7752)",
      aerolinea_normalizada: { nombre: "JetSMART", iata: "ja" },
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const details = asVuelo(parsed.details);
    expect(details?.aerolinea).toBe("JetSMART (JA7730/JA7752)");
    expect(details?.aerolinea_normalizada).toEqual({ nombre: "JetSMART", iata: "JA" });
    expect(details?.aerolinea_iata).toBe("JA");
    expect(details?.aerolinea_nombre).toBe("JetSMART");
    expect(airlineKeys(details!)).toEqual(["JA"]);
    expect(airlineLabel(details!)).toBe("JetSMART (JA)");
  });

  it("acepta IATA alfanuméricos (G3, H2) y agrupa el texto sucio de respaldo", () => {
    const jets = [
      post({ ...base, aerolinea: "JetSMART (JA7730/JA7752)", destino: "CUN" }, "j1"),
      post({ ...base, aerolinea: "JetSMART (JA872)", destino: "AEP" }, "j2"),
      post({ ...base, aerolinea: "JetSMART", destino: "SCL" }, "j3"),
    ];
    const copa = post({ ...base, aerolinea: "Copa Airlines (CM118/CM293)", destino: "PTY" }, "c1");
    const sky = post({ ...base, aerolinea: "SKY Airline (H2620)", destino: "GIG" }, "s1");
    const mixed = post(
      {
        ...base,
        aerolinea: "Aerolíneas Argentinas (AR1281/AR1250/G31230)",
        destino: "GRU",
        tramos: [
          { numero_vuelo: "AR1281", origen: "MDZ", destino: "AEP" },
          { numero_vuelo: "AR1250", origen: "AEP", destino: "EZE" },
          { numero_vuelo: "G31230", origen: "EZE", destino: "GRU" },
        ],
      },
      "mix",
    );
    const options = uniqueAerolineas([...jets, copa, sky, mixed]);
    expect(options.map((item) => item.label)).toEqual([
      "Aerolíneas Argentinas (AR)",
      "Copa Airlines (CM)",
      "GOL (G3)",
      "JetSMART (JA)",
      "Sky (H2)",
    ]);
    expect(options.every((item) => !item.label.includes("JA7730") && !item.label.includes("CM118"))).toBe(
      true,
    );
    expect(stripAirlineDecorations("JetSMART (JA7730/JA7752)")).toBe("JetSMART");
    expect(airlineKeys(asVuelo(mixed.details)!).sort()).toEqual(["AR", "G3"]);
    expect(matchesVuelosFilters(mixed, { ...EMPTY_VUELOS_FILTERS, aerolineas: ["AR"] })).toBe(true);
    expect(matchesVuelosFilters(mixed, { ...EMPTY_VUELOS_FILTERS, aerolineas: ["G3"] })).toBe(true);
    expect(matchesVuelosFilters(jets[0], { ...EMPTY_VUELOS_FILTERS, aerolineas: ["G3"] })).toBe(false);
    expect(matchesVuelosFilters(copa, { ...EMPTY_VUELOS_FILTERS, aerolineas: ["CM"] })).toBe(true);
  });
});

describe("estado y cambios del vuelo", () => {
  it("normaliza estado, acepta cambios y oculta no disponibles por defecto", () => {
    const parsed = parsePostDetails("vuelo", {
      ...base,
      status: "no disponible",
      cambios: [
        { field: "precio", from: 189, to: 210 },
        { campo: "equipaje", valor_anterior: "Carry-on incluido", valor_nuevo: "Solo mochila" },
      ],
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const details = asVuelo(parsed.details);
    expect(details?.estado).toBe("no-disponible");
    expect(details?.cambios).toEqual([
      { campo: "precio", anterior: 189, nuevo: 210 },
      { campo: "equipaje", anterior: "Carry-on incluido", nuevo: "Solo mochila" },
    ]);
    expect(normalizeVueloEstado("agotado")).toBe("no-disponible");
    expect(vueloEstado(details!)).toBe("no-disponible");
    const hidden = post(parsed.details, "gone");
    expect(matchesVuelosFilters(hidden, EMPTY_VUELOS_FILTERS)).toBe(false);
    expect(
      matchesVuelosFilters(hidden, { ...EMPTY_VUELOS_FILTERS, estados: ["no-disponible"] }),
    ).toBe(true);
    expect(isDefaultVuelosEstados([])).toBe(true);
    expect(effectiveVuelosEstados(EMPTY_VUELOS_FILTERS)).toEqual(["activo", "cambiado"]);
    expect(countVuelosFilters({ ...EMPTY_VUELOS_FILTERS, estados: ["no-disponible"] })).toBe(1);
    expect(countVuelosFilters(EMPTY_VUELOS_FILTERS)).toBe(0);
    const href = vuelosHref({ ...EMPTY_VUELOS_FILTERS, estados: ["no-disponible"] });
    expect(href).toContain("estado=no-disponible");
    expect(parseVuelosFilters({ estado: "cambiado,no-disponible" }).estados).toEqual([
      "cambiado",
      "no-disponible",
    ]);
  });
});

describe("upsert de vuelo por source_id", () => {
  it("re-enviar el mismo source_id actualiza el vuelo en vez de duplicarlo", async () => {
    const { MemoryRepository } = await import("./memory-repository");
    const { hashApiKey } = await import("./api-keys");
    const { publishPost } = await import("./publishing");
    const repo = new MemoryRepository();
    const key = "gb_test_vuelos";
    repo.bots.push({
      id: "bot_v",
      name: "Vuelos",
      slug: "vuelos",
      description: "",
      status: null,
      status_updated_at: null,
      created_at: "",
      updated_at: "",
    } as never);
    repo.keys.push({
      botId: "bot_v",
      hash: hashApiKey(key),
      prefix: "gb_test_v",
      revokedAt: null,
    } as never);
    const payload = {
      title: "MDZ → Buenos Aires (AEP)",
      body: "Oferta",
      kind: "vuelo",
      details: { ...base, source_id: "mdz-aep-ar-2026-12-10", precio_usd: 189, categoria: "mejor-equilibrio" },
    };
    const first = await publishPost(repo, `Bearer ${key}`, payload);
    expect(first.ok && first.status).toBe(201);
    const again = await publishPost(repo, `Bearer ${key}`, {
      ...payload,
      details: {
        ...payload.details,
        precio_usd: 210,
        estado: "cambiado",
        categoria: "equilibrado",
        cambios: [{ campo: "precio", anterior: 189, nuevo: 210 }],
      },
    });
    expect(again.ok && again.status).toBe(200);
    expect(again.ok && "upserted" in again.data && again.data.upserted).toBe(true);
    expect(repo.posts.filter((item) => item.bot_id === "bot_v")).toHaveLength(1);
    const stored = asVuelo(repo.posts[0].details);
    expect(stored?.precio_usd).toBe(210);
    expect(stored?.estado).toBe("cambiado");
    expect(stored?.categoria).toBe("equilibrado");
    const other = await publishPost(repo, `Bearer ${key}`, {
      ...payload,
      details: { ...payload.details, source_id: "otro-id", destino: "Cancún (CUN)" },
    });
    expect(other.ok && other.status).toBe(201);
    expect(repo.posts.filter((item) => item.bot_id === "bot_v")).toHaveLength(2);
  });
});
