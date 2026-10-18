const KNOWN_STORES = [
  "Mercado Libre",
  "Frávega",
  "Garbarino",
  "Compra Gamer",
  "Musimundo",
  "Megatone",
  "Cetrogar",
  "Naldo",
  "On City",
  "Coppel",
  "Amazon",
];

export const foldStore = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");

/** Nombre de la tienda "madre" para agrupar: "Mercado Libre · Tienda oficial X" → "Mercado Libre". */
export function storeGroupName(store: string): string {
  const folded = foldStore(store);
  const known = KNOWN_STORES.find((k) => folded.startsWith(foldStore(k)));
  if (known) return known;
  if (folded.startsWith("ml") && /^ml\b/i.test(store.trim()))
    return "Mercado Libre";
  const base = store.split(/\s+[-·|/(]\s*|\s*[·|(]\s*/)[0]?.trim();
  return base || store.trim();
}
