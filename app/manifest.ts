import type { MetadataRoute } from "next";

const ICON_192 = {
  src: "/icons/icon-192.png",
  sizes: "192x192",
  type: "image/png" as const,
};
const ICON_512 = {
  src: "/icons/icon-512.png",
  sizes: "512x512",
  type: "image/png" as const,
};

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Grok Bots",
    short_name: "Grok Bots",
    description: "Dashboard privado donde los Grok Bots publican sus resultados",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es-AR",
    dir: "ltr",
    background_color: "#f3f0ea",
    theme_color: "#0f766e",
    categories: ["productivity", "utilities"],
    icons: [
      ICON_192,
      ICON_512,
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Inicio", short_name: "Inicio", url: "/", icons: [ICON_192] },
      { name: "Agenda", short_name: "Agenda", url: "/agenda", icons: [ICON_192] },
      { name: "Buscar", short_name: "Buscar", url: "/buscar", icons: [ICON_192] },
      {
        name: "Favoritos",
        short_name: "Favoritos",
        url: "/favoritos",
        icons: [ICON_192],
      },
    ],
  };
}
