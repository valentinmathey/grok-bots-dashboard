export type PrimaryTab = "inicio" | "agenda" | "buscar" | "guardados" | "mas";

export function titleFromPathname(pathname: string): string {
  if (pathname === "/") return "Tus bots";
  if (pathname.startsWith("/agenda")) return "Agenda";
  if (pathname.startsWith("/buscar")) return "Buscar";
  if (pathname.startsWith("/favoritos")) return "Guardados";
  if (pathname.startsWith("/pedidos")) return "Pedidos";
  if (pathname.startsWith("/estadisticas")) return "Estadísticas";
  if (pathname.startsWith("/audios")) return "Audios";
  if (pathname.startsWith("/notificaciones")) return "Notificaciones";
  if (pathname.startsWith("/ajustes")) return "Ajustes";
  if (pathname.startsWith("/bots/nuevo")) return "Nuevo bot";
  if (pathname.startsWith("/bots/")) return "Bot";
  return "Grok Bots";
}

export function primaryTabFromPathname(pathname: string): PrimaryTab {
  if (pathname.startsWith("/agenda")) return "agenda";
  if (pathname.startsWith("/buscar")) return "buscar";
  if (pathname.startsWith("/favoritos")) return "guardados";
  if (
    pathname.startsWith("/pedidos") ||
    pathname.startsWith("/estadisticas") ||
    pathname.startsWith("/audios") ||
    pathname.startsWith("/notificaciones") ||
    pathname.startsWith("/ajustes") ||
    pathname.startsWith("/bots/nuevo")
  ) {
    return "mas";
  }
  if (pathname === "/") return "inicio";
  return "inicio";
}

export function isMoreRoute(pathname: string): boolean {
  return primaryTabFromPathname(pathname) === "mas";
}
