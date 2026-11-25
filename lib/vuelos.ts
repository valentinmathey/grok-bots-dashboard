import { z } from "zod";
import { formatMoney } from "@/lib/format";
import { isHttpUrl } from "@/lib/images";
import type { Post } from "@/lib/types";

export const VUELO_ORIGENES = ["MDZ", "SCL"] as const;
export type VueloOrigen = (typeof VUELO_ORIGENES)[number];

/** Valores canónicos de categoría. `mejor-equilibrio` se normaliza a `equilibrado`. */
export const VUELO_CATEGORIAS = ["mas-barato", "equilibrado", "mas-rapido"] as const;
export type VueloCategoria = (typeof VUELO_CATEGORIAS)[number];

export const VUELO_VARIACIONES = ["bajo", "subio", "nuevo", "igual"] as const;
export type VueloVariacion = (typeof VUELO_VARIACIONES)[number];

export const ORIGEN_LABELS: Record<VueloOrigen, string> = {
  MDZ: "Mendoza (MDZ)",
  SCL: "Santiago (SCL)",
};

export const CATEGORIA_LABELS: Record<VueloCategoria, string> = {
  "mas-barato": "Más barato",
  equilibrado: "Equilibrado",
  "mas-rapido": "Más rápido",
};

export const VARIACION_LABELS: Record<VueloVariacion, string> = {
  bajo: "Bajó",
  subio: "Subió",
  nuevo: "Nuevo",
  igual: "Igual",
};

export const VUELO_AEROLINEA_TIPOS = ["low cost", "tradicional"] as const;
export type VueloAerolineaTipo = (typeof VUELO_AEROLINEA_TIPOS)[number];

export const AEROLINEA_TIPO_LABELS: Record<VueloAerolineaTipo, string> = {
  "low cost": "Low cost",
  tradicional: "Tradicional",
};

export const VUELO_ESTADOS = ["activo", "cambiado", "no-disponible"] as const;
export type VueloEstado = (typeof VUELO_ESTADOS)[number];

export const VUELO_ESTADO_LABELS: Record<VueloEstado, string> = {
  activo: "Activo",
  cambiado: "Cambió",
  "no-disponible": "No disponible",
};

/** Sin selección explícita se ocultan los no disponibles. */
export const DEFAULT_VUELOS_ESTADOS: VueloEstado[] = ["activo", "cambiado"];

const httpUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => isHttpUrl(value), {
    message: "La URL tiene que ser http o https",
  });

const ymd = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Usá el formato YYYY-MM-DD");

const money = z.number().finite().min(0).max(10_000_000);

/** Textos largos (equipaje, tarifa, notas…). Si se pasa, la validación falla: no recortamos. */
export const VUELO_TEXT_MAX = 1000;
/** Tope del JSON de details de un vuelo. */
export const VUELO_DETAILS_MAX_CHARS = 64_000;

const textTooLong = (campo = "Este texto") =>
  `${campo} no puede superar ${VUELO_TEXT_MAX} caracteres (no se recorta: acortalo o dividilo)`;

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/ /g, "-");
}

function isSinConfirmar(value: unknown): boolean {
  return typeof value === "string" && fold(value) === "sin-confirmar";
}

export function normalizeVueloCategoria(value: string): VueloCategoria | null {
  const key = fold(value);
  if (["mas-barato", "masbarato", "barato"].includes(key)) return "mas-barato";
  if (
    ["equilibrado", "mejor-equilibrio", "mejorequilibrio", "equilibrio"].includes(key)
  ) {
    return "equilibrado";
  }
  if (["mas-rapido", "masrapido", "rapido"].includes(key)) return "mas-rapido";
  return null;
}

export function normalizeAerolineaTipo(value: string): VueloAerolineaTipo | null {
  const key = fold(value);
  if (["low-cost", "lowcost", "lcc"].includes(key)) return "low cost";
  if (["tradicional", "legacy", "full-service", "fullservice", "network"].includes(key)) {
    return "tradicional";
  }
  return null;
}

export function normalizeVueloEstado(value: string): VueloEstado | null {
  const key = fold(value);
  if (["activo", "disponible", "active", "ok"].includes(key)) return "activo";
  if (["cambiado", "cambio", "changed"].includes(key)) return "cambiado";
  if (
    [
      "no-disponible",
      "nodisponible",
      "no-available",
      "unavailable",
      "agotado",
      "sold-out",
    ].includes(key)
  ) {
    return "no-disponible";
  }
  return null;
}

const looseNumber = z.preprocess((value) => {
  if (isSinConfirmar(value)) return "sin confirmar";
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.trim().replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return value;
}, z.union([money, z.literal("sin confirmar")]));

const looseInt = z.preprocess((value) => {
  if (isSinConfirmar(value)) return "sin confirmar";
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.trim().replace(",", "."));
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  return value;
}, z.union([z.number().int().min(0).max(20), z.literal("sin confirmar")]));

function preprocessFlag(value: unknown): unknown {
  if (isSinConfirmar(value)) return "sin confirmar";
  if (typeof value === "string") {
    const key = fold(value);
    if (["si", "yes", "true", "incluido", "incluye"].includes(key)) return true;
    if (["no", "false"].includes(key)) return false;
  }
  return value;
}

const looseFlag = z.preprocess(
  preprocessFlag,
  z.union([
    z.boolean(),
    z.literal("sin confirmar"),
    z.string().trim().min(1).max(VUELO_TEXT_MAX, textTooLong()),
  ]),
);

const looseText = z.preprocess(
  (value) => (isSinConfirmar(value) ? "sin confirmar" : value),
  z.union([
    z.literal("sin confirmar"),
    z.string().trim().min(1).max(VUELO_TEXT_MAX, textTooLong()),
  ]),
);

const looseTextLong = looseText;

export type LooseFlag = boolean | "sin confirmar" | string;
export type LooseNumber = number | "sin confirmar";
export type LooseText = string | "sin confirmar";

function escalasFromUnknown(value: unknown, detalle?: unknown): unknown {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    const n = Math.trunc(value);
    const base = n <= 0 ? "Directo" : n === 1 ? "1 escala" : `${n} escalas`;
    const extra = typeof detalle === "string" && detalle.trim() && !isSinConfirmar(detalle)
      ? detalle.trim()
      : "";
    return extra ? `${base} (${extra})` : base;
  }
  return value;
}

function equipajeFromUnknown(value: unknown): unknown {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const bag = value as {
    valija_despachada?: unknown;
    costo_extra?: unknown;
    moneda?: unknown;
    texto?: unknown;
  };
  if (typeof bag.texto === "string" && bag.texto.trim()) return bag.texto.trim();
  if (bag.valija_despachada === true) return "Con valija despachada";
  if (typeof bag.costo_extra === "number" && bag.costo_extra > 0) {
    const currency = typeof bag.moneda === "string" && bag.moneda.trim() ? bag.moneda.trim() : "USD";
    const amount = bag.costo_extra % 1 === 0 ? String(bag.costo_extra) : bag.costo_extra.toFixed(2);
    const prefix = currency.toUpperCase() === "USD" ? "US$" : currency;
    return `Sin valija despachada · +${prefix} ${amount}`;
  }
  if (bag.valija_despachada === false) return "Sin valija despachada";
  return value;
}

function hasPrice(value: {
  precio_usd?: LooseNumber;
  precio_ars?: LooseNumber;
  precio_original?: LooseNumber;
  precio_total_ida_vuelta?: LooseNumber;
}): boolean {
  return [value.precio_usd, value.precio_ars, value.precio_original, value.precio_total_ida_vuelta].some(
    (item) => typeof item === "number",
  );
}

/** Aliases del bot y nombres alternativos. */
export function preprocessVueloInput(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const source = raw as Record<string, unknown>;
  const next: Record<string, unknown> = { ...source };
  if (next.duracion_total == null && typeof next.duracion === "string") {
    next.duracion_total = next.duracion;
  }
  if (next.link == null) {
    if (typeof next.link_directo === "string") next.link = next.link_directo;
    else if (typeof next.source_url === "string") next.link = next.source_url;
  }
  if (next.moneda == null && typeof next.moneda_original === "string") {
    next.moneda = next.moneda_original;
  }
  if (typeof next.categoria === "string") {
    if (isSinConfirmar(next.categoria)) {
      delete next.categoria;
    } else {
      next.categoria = normalizeVueloCategoria(next.categoria) ?? next.categoria;
    }
  }
  const detalleEscalas = next.escalas_detalle;
  next.escalas = escalasFromUnknown(next.escalas, detalleEscalas);
  if (Array.isArray(detalleEscalas) && next.conexiones == null) {
    next.conexiones = detalleEscalas;
  }
  if (next.equipaje && typeof next.equipaje === "object" && !Array.isArray(next.equipaje)) {
    if (next.equipaje_detalle == null) next.equipaje_detalle = next.equipaje;
    next.equipaje = equipajeFromUnknown(next.equipaje);
  }
  if (next.articulo_personal == null && next.mochila != null) {
    next.articulo_personal = next.mochila;
  }
  if (next.aerolinea && typeof next.aerolinea === "object" && !Array.isArray(next.aerolinea)) {
    const airline = next.aerolinea as Record<string, unknown>;
    if (next.aerolinea_nombre == null) {
      next.aerolinea_nombre = airline.nombre ?? airline.name ?? airline.aerolinea;
    }
    if (next.aerolinea_iata == null) {
      next.aerolinea_iata = airline.iata ?? airline.codigo ?? airline.code;
    }
    if (next.aerolinea_info == null && airline.info) {
      next.aerolinea_info = airline.info;
    }
    const name = airline.nombre ?? airline.name ?? airline.aerolinea;
    if (typeof name === "string") next.aerolinea = name;
  }
  if (next.aerolinea_iata == null && typeof next.iata === "string") {
    next.aerolinea_iata = next.iata;
  }
  if ((typeof next.aerolinea !== "string" || !next.aerolinea.trim()) && typeof next.aerolinea_nombre === "string") {
    next.aerolinea = next.aerolinea_nombre;
  }
  if (next.aerolinea_info && typeof next.aerolinea_info === "object" && !Array.isArray(next.aerolinea_info)) {
    const info = next.aerolinea_info as Record<string, unknown>;
    const bag = info.equipaje_estandar;
    if (bag && typeof bag === "object" && !Array.isArray(bag)) {
      const pieces = bag as Record<string, unknown>;
      if (pieces.valija == null) {
        pieces.valija = pieces.valija_despachada ?? pieces.valijas ?? pieces.valijas_despachadas;
      }
      if (pieces.carry_on == null) {
        pieces.carry_on = pieces.carryon ?? pieces.equipaje_mano;
      }
      info.equipaje_estandar = pieces;
    }
    if (info.politica_equipaje_url == null) {
      info.politica_equipaje_url =
        info.politica_equipaje ?? info.link_equipaje ?? info.equipaje_url;
    }
    if (typeof info.tipo === "string") {
      if (isSinConfirmar(info.tipo)) {
        info.tipo = "sin confirmar";
      } else {
        info.tipo = normalizeAerolineaTipo(info.tipo) ?? info.tipo;
      }
    }
    next.aerolinea_info = info;
  }
  if (next.estado == null && typeof next.status === "string") {
    next.estado = next.status;
  }
  if (typeof next.estado === "string") {
    next.estado = normalizeVueloEstado(next.estado) ?? next.estado;
  }
  if (Array.isArray(next.cambios)) {
    next.cambios = next.cambios.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return item;
      const row = item as Record<string, unknown>;
      return {
        ...row,
        campo: row.campo ?? row.field ?? row.nombre,
        anterior:
          row.anterior ??
          row.valor_anterior ??
          row.previo ??
          row.from ??
          row.before,
        nuevo: row.nuevo ?? row.valor_nuevo ?? row.actual ?? row.to ?? row.after,
      };
    });
  }
  return next;
}

const carryOnSchema = z.union([
  looseTextLong,
  z.object({
    incluido: looseFlag.optional(),
    peso_kg: looseNumber.optional(),
    medidas: looseText.optional(),
  }),
]);

const valijasSchema = z.union([
  looseTextLong,
  z.object({
    cantidad: looseInt.optional(),
    kg: looseNumber.optional(),
    incluida: looseFlag.optional(),
  }),
]);

export const vueloEquipajeDetalleSchema = z.object({
  articulo_personal: z.union([looseFlag, looseTextLong]).optional(),
  mochila: z.union([looseFlag, looseTextLong]).optional(),
  carry_on: carryOnSchema.optional(),
  valijas_despachadas: valijasSchema.optional(),
  costo_extra: z.union([looseNumber, looseTextLong]).optional(),
  moneda: z.string().trim().max(8).optional(),
});

export const vueloTarifaSchema = z.union([
  looseText,
  z.object({
    nombre: z.string().trim().min(1).max(VUELO_TEXT_MAX, textTooLong("tarifa.nombre")).optional(),
    cambios: looseFlag.optional(),
    reembolso: looseFlag.optional(),
    eleccion_asiento: looseFlag.optional(),
  }),
]);

export const vueloConexionSchema = z.object({
  aeropuerto: z.string().trim().min(1).max(80).optional(),
  espera: looseText.optional(),
  cambio_aeropuerto: looseFlag.optional(),
  cambio_terminal: looseFlag.optional(),
  visa_transito: looseFlag.optional(),
});

const iataCode = z.preprocess((value) => {
  if (value == null || value === "") return undefined;
  if (isSinConfirmar(value)) return "sin confirmar";
  if (typeof value === "string") return value.trim().toUpperCase();
  return value;
}, z.union([
  z.literal("sin confirmar"),
  z
    .string()
    .regex(/^[A-Z]{2,3}$/, "El código IATA tiene que tener 2 o 3 letras, o ser \"sin confirmar\""),
]));

const looseUrl = z.preprocess(
  (value) => (isSinConfirmar(value) ? "sin confirmar" : value),
  z.union([httpUrl, z.literal("sin confirmar")]),
);

export const vueloPiezaEquipajeSchema = z.union([
  looseFlag,
  looseText,
  z.object({
    incluido: looseFlag.optional(),
    kg: looseNumber.optional(),
    texto: looseText.optional(),
  }),
]);

export const vueloDatoConFuenteSchema = z.union([
  looseText,
  looseNumber,
  z.object({
    valor: z.union([looseText, looseNumber]).optional(),
    texto: looseText.optional(),
    url: looseUrl.optional(),
    fuente: looseText.optional(),
  }),
]);

export const vueloFuenteSchema = z.union([
  looseText,
  looseUrl,
  z.object({
    nombre: looseText.optional(),
    url: looseUrl.optional(),
  }),
]);

export const vueloAerolineaInfoSchema = z.object({
  tipo: z
    .union([z.enum(VUELO_AEROLINEA_TIPOS), z.literal("sin confirmar")])
    .optional(),
  alianza: looseText.optional(),
  equipaje_estandar: z
    .union([
      looseText,
      z.object({
        mochila: vueloPiezaEquipajeSchema.optional(),
        carry_on: vueloPiezaEquipajeSchema.optional(),
        valija: vueloPiezaEquipajeSchema.optional(),
      }),
    ])
    .optional(),
  puntualidad: vueloDatoConFuenteSchema.optional(),
  reputacion: vueloDatoConFuenteSchema.optional(),
  politica_equipaje_url: looseUrl.optional(),
  fuentes: z.union([looseText, z.array(vueloFuenteSchema).max(12)]).optional(),
});

const cambioValor = z.union([
  z.string().trim().max(VUELO_TEXT_MAX, textTooLong("cambios")),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);

export const vueloCambioSchema = z.object({
  campo: z.string().trim().min(1).max(80),
  anterior: cambioValor.optional(),
  nuevo: cambioValor.optional(),
});

export const vueloTramoSchema = z.object({
  numero_vuelo: z.string().trim().min(1).max(40).optional(),
  origen: z.string().trim().min(1).max(80).optional(),
  destino: z.string().trim().min(1).max(80).optional(),
  salida: looseText.optional(),
  llegada: looseText.optional(),
  duracion: looseText.optional(),
  codeshare: z.union([looseFlag, looseText]).optional(),
  operador: looseText.optional(),
  operador_nombre: looseText.optional(),
  operador_iata: iataCode.optional(),
});

const vueloDetailsObjectSchema = z
  .object({
    destino: z.string().trim().min(1).max(120),
    origen: z.enum(VUELO_ORIGENES),
    aerolinea: z.string().trim().min(1).max(120),
    fecha_ida: ymd,
    fecha_vuelta: ymd.optional(),
    escalas: looseText.optional(),
    duracion_total: looseText.optional(),
    equipaje: looseTextLong.optional(),
    equipaje_detalle: vueloEquipajeDetalleSchema.optional(),
    tarifa: vueloTarifaSchema.optional(),
    conexiones: z.array(vueloConexionSchema).max(8).optional(),
    tramos: z.array(vueloTramoSchema).max(12).optional(),
    precio_usd: looseNumber.optional(),
    precio_ars: looseNumber.optional(),
    precio_original: looseNumber.optional(),
    moneda: z.string().trim().min(1).max(8).optional(),
    tipo_cambio: z.union([looseNumber, looseText]).optional(),
    incluye_impuestos: looseFlag.optional(),
    incluye_percepciones: looseFlag.optional(),
    precio_ida: looseNumber.optional(),
    precio_vuelta: looseNumber.optional(),
    precio_total_ida_vuelta: looseNumber.optional(),
    categoria: z.enum(VUELO_CATEGORIAS).optional(),
    link: httpUrl,
    link_directo: httpUrl.optional(),
    source_url: httpUrl.optional(),
    sitio_compra: z.string().trim().min(1).max(80).optional(),
    low_cost: looseFlag.optional(),
    fecha_busqueda: z
      .string()
      .trim()
      .min(8)
      .max(40)
      .refine(
        (value) =>
          /^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isNaN(Date.parse(value)),
        { message: "fecha_busqueda tiene que ser YYYY-MM-DD o un ISO" },
      )
      .optional(),
    variacion: z.enum(VUELO_VARIACIONES).optional(),
    precio_usd_previo: looseNumber.optional(),
    source_id: z.string().trim().min(1).max(80).optional(),
    notas: looseTextLong.optional(),
    aerolinea_nombre: looseText.optional(),
    aerolinea_iata: iataCode.optional(),
    aerolinea_info: vueloAerolineaInfoSchema.optional(),
    estado: z.enum(VUELO_ESTADOS).optional(),
    cambios: z.array(vueloCambioSchema).max(20).optional(),
  })
  .refine((value) => JSON.stringify(value).length <= VUELO_DETAILS_MAX_CHARS, {
    message: `details de vuelo no puede superar ${VUELO_DETAILS_MAX_CHARS} caracteres (no se recorta)`,
  })
  .refine((value) => hasPrice(value), {
    message: "Mandá al menos un precio (precio_usd, precio_ars, precio_original o precio_total_ida_vuelta)",
    path: ["precio_usd"],
  })
  .refine(
    (value) => !value.fecha_vuelta || value.fecha_vuelta >= value.fecha_ida,
    {
      message: "fecha_vuelta no puede ser anterior a fecha_ida",
      path: ["fecha_vuelta"],
    },
  );

export const vueloDetailsSchema = z.preprocess(
  preprocessVueloInput,
  vueloDetailsObjectSchema,
);

export type VueloDetails = z.infer<typeof vueloDetailsObjectSchema>;
export type VueloEquipajeDetalle = z.infer<typeof vueloEquipajeDetalleSchema>;
export type VueloConexion = z.infer<typeof vueloConexionSchema>;
export type VueloTramo = z.infer<typeof vueloTramoSchema>;
export type VueloAerolineaInfo = z.infer<typeof vueloAerolineaInfoSchema>;
export type VueloPiezaEquipaje = z.infer<typeof vueloPiezaEquipajeSchema>;
export type VueloDatoConFuente = z.infer<typeof vueloDatoConFuenteSchema>;
export type VueloCambio = z.infer<typeof vueloCambioSchema>;

export function asVuelo(details: unknown): VueloDetails | null {
  const parsed = vueloDetailsSchema.safeParse(details ?? {});
  return parsed.success ? parsed.data : null;
}

/** "2026-12-15" → "15/12" (fecha de calendario, sin zona). */
export function formatYmdDm(ymdValue: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymdValue.trim());
  if (!match) return ymdValue;
  return `${match[3]}/${match[2]}`;
}

export function formatYmdMonth(ymdValue: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(ymdValue.trim());
  if (!match) return ymdValue;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  const label = new Intl.DateTimeFormat("es-AR", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(date)
    .replace(/[\u00a0\u202f\u2007\u2009]/g, " ")
    .replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function monthKey(ymdValue: string): string | null {
  const match = /^(\d{4})-(\d{2})/.exec(ymdValue.trim());
  return match ? `${match[1]}-${match[2]}` : null;
}

export function formatVueloFechas(details: VueloDetails): string {
  const ida = formatYmdDm(details.fecha_ida);
  if (!details.fecha_vuelta) return ida;
  return `${ida} – ${formatYmdDm(details.fecha_vuelta)}`;
}

export function formatUsd(amount: number): string {
  return `US$ ${amount % 1 === 0 ? amount : amount.toFixed(2)}`;
}

export function formatLoose(value: LooseText | LooseNumber | LooseFlag | undefined): string | null {
  if (value === undefined || value === "") return null;
  if (value === "sin confirmar") return "Sin confirmar";
  if (value === true) return "Sí";
  if (value === false) return "No";
  if (typeof value === "number") return String(value);
  return value;
}

export function formatFlag(value: LooseFlag | undefined, si = "Sí", no = "No"): string | null {
  if (value === undefined) return null;
  if (value === true) return si;
  if (value === false) return no;
  if (value === "sin confirmar") return "Sin confirmar";
  return value;
}

export function precioOrden(details: VueloDetails): number | null {
  for (const value of [
    details.precio_usd,
    details.precio_total_ida_vuelta,
    details.precio_ars,
    details.precio_original,
  ]) {
    if (typeof value === "number") return value;
  }
  return null;
}

export function precioResumen(details: VueloDetails): { main: string; secondary?: string } | null {
  const usd = typeof details.precio_usd === "number" ? details.precio_usd : null;
  const ars = typeof details.precio_ars === "number" ? details.precio_ars : null;
  const total =
    typeof details.precio_total_ida_vuelta === "number" ? details.precio_total_ida_vuelta : null;
  const orig = typeof details.precio_original === "number" ? details.precio_original : null;
  const moneda = details.moneda || (ars != null && usd == null ? "ARS" : "USD");
  if (usd != null) {
    let secondary: string | undefined;
    if (ars != null) secondary = `${formatMoney(ars, "ARS")} por persona`;
    else if (orig != null && moneda.toUpperCase() !== "USD") {
      secondary = `${formatMoney(orig, moneda)} en origen`;
    } else if (orig != null && orig !== usd) {
      secondary = formatMoney(orig, moneda);
    }
    return { main: formatUsd(usd), secondary };
  }
  if (ars != null) return { main: formatMoney(ars, "ARS") };
  if (total != null) {
    return {
      main: moneda.toUpperCase() === "ARS" ? formatMoney(total, "ARS") : formatUsd(total),
    };
  }
  if (orig != null) return { main: formatMoney(orig, moneda) };
  return null;
}

export function ofertaHref(details: VueloDetails): string {
  return details.link_directo || details.link;
}

export function escalasLabel(details: VueloDetails): string | null {
  return formatLoose(details.escalas);
}

export function equipajeLabel(details: VueloDetails): string | null {
  const text = formatLoose(details.equipaje);
  if (text) return text;
  const det = details.equipaje_detalle;
  if (!det) return null;
  const parts: string[] = [];
  const personal = formatLoose(det.articulo_personal ?? det.mochila);
  if (personal) parts.push(`Artículo personal: ${personal === "Sí" ? "incluido" : personal}`);
  if (typeof det.carry_on === "string") {
    const carry = formatLoose(det.carry_on);
    if (carry) parts.push(`Carry-on: ${carry}`);
  } else if (det.carry_on) {
    const bits = [
      formatFlag(det.carry_on.incluido, "incluido", "no incluido"),
      typeof det.carry_on.peso_kg === "number" ? `${det.carry_on.peso_kg} kg` : formatLoose(det.carry_on.peso_kg),
      formatLoose(det.carry_on.medidas),
    ].filter(Boolean);
    if (bits.length) parts.push(`Carry-on: ${bits.join(", ")}`);
  }
  if (typeof det.valijas_despachadas === "string") {
    const bags = formatLoose(det.valijas_despachadas);
    if (bags) parts.push(`Valija: ${bags}`);
  } else if (det.valijas_despachadas) {
    const v = det.valijas_despachadas;
    const bits = [
      typeof v.cantidad === "number" ? `${v.cantidad} valija${v.cantidad === 1 ? "" : "s"}` : formatLoose(v.cantidad),
      typeof v.kg === "number" ? `${v.kg} kg` : formatLoose(v.kg),
      formatFlag(v.incluida, "incluida", "no incluida"),
    ].filter(Boolean);
    if (bits.length) parts.push(bits.join(", "));
  }
  const extra = formatLoose(det.costo_extra);
  if (extra) {
    const currency = det.moneda?.toUpperCase() === "USD" ? "US$" : det.moneda;
    parts.push(
      typeof det.costo_extra === "number"
        ? `Extra ${currency ? `${currency} ` : ""}${extra}`
        : extra,
    );
  }
  return parts.length ? parts.join(" · ") : null;
}

export function hasVueloDetalle(details: VueloDetails): boolean {
  return Boolean(
    details.equipaje ||
      details.escalas ||
      details.notas ||
      details.equipaje_detalle ||
      details.tarifa ||
      (details.conexiones && details.conexiones.length) ||
      (details.tramos && details.tramos.length) ||
      details.tipo_cambio != null ||
      details.incluye_impuestos != null ||
      details.incluye_percepciones != null ||
      details.precio_ida != null ||
      details.precio_vuelta != null ||
      details.precio_ars != null ||
      details.precio_total_ida_vuelta != null ||
      details.low_cost != null ||
      details.sitio_compra ||
      details.link_directo ||
      (details.cambios && details.cambios.length) ||
      details.estado === "cambiado" ||
      details.estado === "no-disponible",
  );
}

export type VuelosSort = "precio" | "fecha";

export type VuelosFilters = {
  destinos: string[];
  origenes: VueloOrigen[];
  meses: string[];
  categorias: VueloCategoria[];
  aerolineas: string[];
  estados: VueloEstado[];
  sort: VuelosSort;
};

export const EMPTY_VUELOS_FILTERS: VuelosFilters = {
  destinos: [],
  origenes: [],
  meses: [],
  categorias: [],
  aerolineas: [],
  estados: [],
  sort: "precio",
};

export function vueloEstado(details: VueloDetails): VueloEstado {
  return details.estado ?? "activo";
}

export function effectiveVuelosEstados(filters: VuelosFilters): VueloEstado[] {
  return filters.estados.length ? filters.estados : DEFAULT_VUELOS_ESTADOS;
}

export function isDefaultVuelosEstados(estados: VueloEstado[]): boolean {
  if (!estados.length) return true;
  if (estados.length !== DEFAULT_VUELOS_ESTADOS.length) return false;
  return DEFAULT_VUELOS_ESTADOS.every((estado) => estados.includes(estado));
}

export function toggleVuelosEstados(current: VueloEstado[], value: VueloEstado): VueloEstado[] {
  const effective = effectiveVuelosEstados({ ...EMPTY_VUELOS_FILTERS, estados: current });
  const next = effective.includes(value)
    ? effective.filter((item) => item !== value)
    : [...effective, value];
  return isDefaultVuelosEstados(next) ? [] : next;
}

export function countVuelosFilters(filters: VuelosFilters): number {
  return (
    filters.destinos.length +
    filters.origenes.length +
    filters.meses.length +
    filters.categorias.length +
    filters.aerolineas.length +
    Number(!isDefaultVuelosEstados(filters.estados))
  );
}

export function matchesVuelosFilters(post: Post, filters: VuelosFilters): boolean {
  const details = asVuelo(post.details);
  if (!details) return false;
  if (filters.destinos.length && !filters.destinos.includes(details.destino)) {
    return false;
  }
  if (filters.origenes.length && !filters.origenes.includes(details.origen)) {
    return false;
  }
  const mes = monthKey(details.fecha_ida);
  if (filters.meses.length && (!mes || !filters.meses.includes(mes))) {
    return false;
  }
  if (filters.categorias.length && details.categoria && !filters.categorias.includes(details.categoria)) {
    return false;
  }
  if (filters.categorias.length && !details.categoria) return false;
  if (filters.aerolineas.length && !filters.aerolineas.includes(airlineKey(details))) {
    return false;
  }
  if (!effectiveVuelosEstados(filters).includes(vueloEstado(details))) {
    return false;
  }
  return true;
}

export function sortVuelos(posts: Post[], sort: VuelosSort): Post[] {
  return [...posts].sort((a, b) => {
    const da = asVuelo(a.details);
    const db = asVuelo(b.details);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    if (sort === "fecha") {
      const byDate = da.fecha_ida.localeCompare(db.fecha_ida);
      if (byDate) return byDate;
      return (precioOrden(da) ?? Number.POSITIVE_INFINITY) - (precioOrden(db) ?? Number.POSITIVE_INFINITY);
    }
    const byPrice = (precioOrden(da) ?? Number.POSITIVE_INFINITY) - (precioOrden(db) ?? Number.POSITIVE_INFINITY);
    if (byPrice) return byPrice;
    return da.fecha_ida.localeCompare(db.fecha_ida);
  });
}

export function uniqueDestinos(posts: Post[]): string[] {
  const seen = new Set<string>();
  for (const post of posts) {
    const details = asVuelo(post.details);
    if (details?.destino) seen.add(details.destino);
  }
  return [...seen].sort((a, b) => a.localeCompare(b, "es"));
}

export function uniqueMeses(posts: Post[]): string[] {
  const seen = new Set<string>();
  for (const post of posts) {
    const details = asVuelo(post.details);
    const mes = details ? monthKey(details.fecha_ida) : null;
    if (mes) seen.add(mes);
  }
  return [...seen].sort();
}

function firstSearchValue(search: Record<string, string | string[] | undefined>, key: string) {
  const value = search[key];
  return Array.isArray(value) ? value[0] : value;
}

function splitList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseVuelosFilters(
  search: Record<string, string | string[] | undefined>,
): VuelosFilters {
  const origenes = splitList(firstSearchValue(search, "origen")).filter((item): item is VueloOrigen =>
    (VUELO_ORIGENES as readonly string[]).includes(item),
  );
  const categorias = splitList(firstSearchValue(search, "categoria"))
    .map((item) => normalizeVueloCategoria(item) ?? item)
    .filter((item): item is VueloCategoria =>
      (VUELO_CATEGORIAS as readonly string[]).includes(item),
    );
  const meses = splitList(firstSearchValue(search, "mes")).filter((item) => /^\d{4}-\d{2}$/.test(item));
  const sortRaw = firstSearchValue(search, "sort");
  const sort: VuelosSort = sortRaw === "fecha" ? "fecha" : "precio";
  return {
    destinos: splitList(firstSearchValue(search, "destino")),
    origenes,
    meses,
    categorias,
    aerolineas: splitList(firstSearchValue(search, "aerolinea")),
    estados: splitList(firstSearchValue(search, "estado"))
      .map((item) => normalizeVueloEstado(item) ?? item)
      .filter((item): item is VueloEstado => (VUELO_ESTADOS as readonly string[]).includes(item)),
    sort,
  };
}

export function vuelosHref(
  filters: VuelosFilters,
  patch: Partial<VuelosFilters> = {},
  slug = "vuelos",
): string {
  const next: VuelosFilters = { ...filters, ...patch };
  const params = new URLSearchParams();
  if (next.destinos.length) params.set("destino", next.destinos.join(","));
  if (next.origenes.length) params.set("origen", next.origenes.join(","));
  if (next.meses.length) params.set("mes", next.meses.join(","));
  if (next.categorias.length) params.set("categoria", next.categorias.join(","));
  if (next.aerolineas.length) params.set("aerolinea", next.aerolineas.join(","));
  if (!isDefaultVuelosEstados(next.estados)) params.set("estado", next.estados.join(","));
  if (next.sort !== "precio") params.set("sort", next.sort);
  const query = params.toString();
  return query ? `/bots/${slug}?${query}` : `/bots/${slug}`;
}

export function airlineIata(details: VueloDetails): string | null {
  const raw = details.aerolinea_iata;
  if (!raw || raw === "sin confirmar") return null;
  return raw;
}

export function airlineName(details: VueloDetails): string {
  const nombre = details.aerolinea_nombre;
  if (typeof nombre === "string" && nombre && nombre !== "sin confirmar") return nombre;
  return details.aerolinea;
}

export function airlineKey(details: VueloDetails): string {
  const iata = airlineIata(details);
  if (iata) return iata;
  return fold(airlineName(details)) || fold(details.aerolinea);
}

export function airlineLabel(details: VueloDetails): string {
  const name = airlineName(details);
  const iata = airlineIata(details);
  return iata ? `${name} (${iata})` : name;
}

export type AerolineaOption = {
  key: string;
  label: string;
  iata: string | null;
};

export function uniqueAerolineas(posts: Post[]): AerolineaOption[] {
  const map = new Map<string, { label: string; iata: string | null; at: string }>();
  for (const post of posts) {
    const details = asVuelo(post.details);
    if (!details) continue;
    const key = airlineKey(details);
    if (!key) continue;
    const at = post.updated_at ?? post.created_at;
    const prev = map.get(key);
    if (!prev || at >= prev.at) {
      map.set(key, { label: airlineLabel(details), iata: airlineIata(details), at });
    }
  }
  return [...map.entries()]
    .map(([key, value]) => ({ key, label: value.label, iata: value.iata }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

export function hasAerolineaFicha(details: VueloDetails): boolean {
  const info = details.aerolinea_info;
  if (!info) return false;
  return Boolean(
    info.tipo != null ||
      info.alianza ||
      info.equipaje_estandar ||
      info.puntualidad != null ||
      info.reputacion != null ||
      info.politica_equipaje_url ||
      info.fuentes,
  );
}

export type AerolineaFicha = {
  key: string;
  label: string;
  nombre: string;
  iata: string | null;
  info: VueloAerolineaInfo | null;
  postId: string | null;
  sourceAt: string | null;
};

export function pickAerolineaFicha(posts: Post[], key: string): AerolineaFicha | null {
  const candidates = posts
    .map((post) => ({ post, details: asVuelo(post.details) }))
    .filter((row): row is { post: Post; details: VueloDetails } =>
      Boolean(row.details && airlineKey(row.details) === key),
    )
    .sort((a, b) =>
      (b.post.updated_at ?? b.post.created_at).localeCompare(a.post.updated_at ?? a.post.created_at),
    );
  if (!candidates.length) return null;
  const withInfo = candidates.find((row) => hasAerolineaFicha(row.details)) ?? candidates[0];
  return {
    key,
    label: airlineLabel(withInfo.details),
    nombre: airlineName(withInfo.details),
    iata: airlineIata(withInfo.details),
    info: withInfo.details.aerolinea_info ?? null,
    postId: withInfo.post.id,
    sourceAt: withInfo.post.updated_at ?? withInfo.post.created_at,
  };
}

export function buildAerolineaFichas(posts: Post[]): Record<string, AerolineaFicha> {
  const out: Record<string, AerolineaFicha> = {};
  for (const option of uniqueAerolineas(posts)) {
    const ficha = pickAerolineaFicha(posts, option.key);
    if (ficha) out[option.key] = ficha;
  }
  return out;
}

export function formatPiezaEquipaje(value: VueloPiezaEquipaje | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "boolean") return formatFlag(value, "Incluida", "No incluida");
  if (typeof value === "string" || typeof value === "number") return formatLoose(value);
  const parts = [
    formatFlag(value.incluido, "Incluida", "No incluida"),
    typeof value.kg === "number" ? `${value.kg} kg` : formatLoose(value.kg),
    formatLoose(value.texto),
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export function formatDatoConFuente(value: VueloDatoConFuente | undefined): {
  texto: string | null;
  fuente: string | null;
  url: string | null;
} {
  if (value == null) return { texto: null, fuente: null, url: null };
  if (typeof value === "string" || typeof value === "number") {
    return { texto: formatLoose(value), fuente: null, url: null };
  }
  const texto =
    formatLoose(value.texto) ??
    (typeof value.valor === "number" ? String(value.valor) : formatLoose(value.valor));
  const url = value.url && value.url !== "sin confirmar" ? value.url : null;
  return { texto, fuente: formatLoose(value.fuente), url };
}

export function formatFuentes(
  value: VueloAerolineaInfo["fuentes"] | undefined,
): { label: string; url: string | null }[] {
  if (value == null) return [];
  if (typeof value === "string") {
    const label = formatLoose(value);
    return label ? [{ label, url: value.startsWith("http") ? value : null }] : [];
  }
  const rows: { label: string; url: string | null }[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const label = formatLoose(item);
      if (label) rows.push({ label, url: item.startsWith("http") ? item : null });
      continue;
    }
    const url = item.url && item.url !== "sin confirmar" ? item.url : null;
    const label = formatLoose(item.nombre) ?? url;
    if (label) rows.push({ label, url });
  }
  return rows;
}

export function formatTramoOperador(tramo: VueloTramo): string | null {
  const name = formatLoose(tramo.operador_nombre) ?? formatLoose(tramo.operador);
  const iata = tramo.operador_iata && tramo.operador_iata !== "sin confirmar" ? tramo.operador_iata : null;
  if (name && iata) return `${name} (${iata})`;
  return name ?? (iata ? iata : null);
}

/** Ejemplo mínimo alineado al JSON que publica Vuelos. */
export function sampleVueloDetails(): VueloDetails {
  return {
    destino: "Buenos Aires (AEP)",
    origen: "MDZ",
    aerolinea: "Aerolíneas Argentinas",
    fecha_ida: "2026-12-10",
    fecha_vuelta: "2026-12-18",
    escalas: "Directo",
    duracion_total: "Ida: 1h 50m",
    equipaje: "Carry-on + 1 valija despachada 23 kg incluida",
    precio_usd: 189,
    precio_original: 189,
    moneda: "USD",
    categoria: "equilibrado",
    link: "https://www.google.com/travel/flights",
    fecha_busqueda: "2026-11-25",
    variacion: "nuevo",
  };
}

export function formatCambioValor(value: VueloCambio["anterior"]): string | null {
  if (value == null) return null;
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number") return String(value);
  return formatLoose(value);
}

export function formatCambioCampo(campo: string): string {
  const labels: Record<string, string> = {
    precio: "Precio",
    precio_usd: "Precio USD",
    precio_ars: "Precio ARS",
    equipaje: "Equipaje",
    horarios: "Horarios",
    horario: "Horarios",
    escalas: "Escalas",
    duracion: "Duración",
    duracion_total: "Duración",
    tarifa: "Tarifa",
    fecha_ida: "Fecha de ida",
    fecha_vuelta: "Fecha de vuelta",
  };
  return labels[fold(campo).replace(/-/g, "_")] ?? campo.replace(/_/g, " ");
}

