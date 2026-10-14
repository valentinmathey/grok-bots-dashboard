export type PrimaryTab = "inicio" | "agenda" | "buscar" | "bots" | "mas";

export function titleFromPathname(pathname: string): string {
  if (pathname === "/") return "Resumen del día";
  if (pathname === "/bots") return "Tus bots";
  if (pathname.startsWith("/agenda")) return "Agenda";
  if (pathname.startsWith("/buscar")) return "Buscar";
  if (pathname.startsWith("/favoritos")) return "Favoritos";
  if (pathname.startsWith("/publicaciones")) return "Publicaciones";
  if (pathname.startsWith("/pedidos")) return "Pedidos";
  if (pathname.startsWith("/estadisticas")) return "Estadísticas";
  if (pathname.startsWith("/audios")) return "Audios";
  if (pathname.startsWith("/rutinas")) return "Rutinas";
  if (pathname.startsWith("/notificaciones")) return "Notificaciones";
  if (pathname.startsWith("/ajustes")) return "Ajustes";
  if (pathname.startsWith("/bots/nuevo")) return "Nuevo bot";
  if (pathname.startsWith("/bots/")) return "Bot";
  return "Grok Bots";
}

export function primaryTabFromPathname(pathname: string): PrimaryTab {
  if (pathname.startsWith("/agenda")) return "agenda";
  if (pathname.startsWith("/buscar")) return "buscar";
  if (
    pathname.startsWith("/publicaciones") ||
    pathname.startsWith("/pedidos") ||
    pathname.startsWith("/favoritos") ||
    pathname.startsWith("/estadisticas") ||
    pathname.startsWith("/audios") ||
    pathname.startsWith("/rutinas") ||
    pathname.startsWith("/notificaciones") ||
    pathname.startsWith("/ajustes") ||
    pathname.startsWith("/bots/nuevo")
  ) {
    return "mas";
  }
  if (pathname === "/bots" || pathname.startsWith("/bots/")) return "bots";
  return "inicio";
}

export function isMoreRoute(pathname: string): boolean {
  return primaryTabFromPathname(pathname) === "mas";
}
