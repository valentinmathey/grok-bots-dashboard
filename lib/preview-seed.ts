import { MemoryRepository } from "@/lib/memory-repository";
import type { PostImage, PostKind } from "@/lib/types";

let cached: MemoryRepository | null = null;

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3600_000).toISOString();
}

function daysAgo(days: number, hour = 14): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, (days * 7) % 60, 0, 0);
  return date.toISOString();
}

export function getPreviewRepository(): MemoryRepository {
  if (cached) {
    return cached;
  }
  const repo = new MemoryRepository();
  const now = new Date().toISOString();

  repo.bots = [
    {
      id: "bot_reportero",
      name: "Reportero",
      slug: "reportero",
      description:
        "Arma informes semanales, resultados de corridas y novedades de producto.",
      status: "Redactando el informe de Atlas de esta semana",
      status_updated_at: hoursAgo(1),
      avatar_color: "blue",
      avatar_shape: "squircle",
      avatar_url: "https://picsum.photos/seed/reportero-av/256/256.jpg",
      created_at: daysAgo(40),
      updated_at: hoursAgo(1),
    },
    {
      id: "bot_scout",
      name: "Scout",
      slug: "scout",
      description: "Sale a buscar señales en el mercado y resume lo que encontró.",
      status: "Mirando menciones de Orion en las últimas 24 h",
      status_updated_at: hoursAgo(3),
      avatar_color: "cyan",
      avatar_shape: "hex",
      avatar_url: null,
      created_at: daysAgo(28),
      updated_at: hoursAgo(3),
    },
    {
      id: "bot_ops",
      name: "Ops",
      slug: "ops",
      description: "Sigue incidentes, deploys y el estado de los servicios.",
      status: "Sin alertas abiertas",
      status_updated_at: hoursAgo(6),
      avatar_color: "orange",
      avatar_shape: "shield",
      avatar_url: null,
      created_at: daysAgo(20),
      updated_at: hoursAgo(6),
    },
    {
      id: "bot_agenda",
      name: "Agenda",
      slug: "agenda",
      description: "Avisa lanzamientos, demos y eventos del calendario.",
      status: "Preparando el brief del demo del jueves",
      status_updated_at: hoursAgo(2),
      avatar_color: "violet",
      avatar_shape: "star",
      avatar_url: null,
      created_at: daysAgo(12),
      updated_at: hoursAgo(2),
    },
    {
      id: "bot_productos",
      name: "Productos compra",
      slug: "productos-compra",
      description:
        "Comparación de precios y rankings de dónde comprar productos en Argentina.",
      status: null,
      status_updated_at: null,
      avatar_color: "maroon",
      avatar_shape: "blob",
      avatar_url: "https://picsum.photos/seed/productos-av/256/256.jpg",
      created_at: daysAgo(6),
      updated_at: hoursAgo(0.12),
    },
  ];

  const reporteroPosts: Array<{
    title: string;
    kind: PostKind;
    product: string | null;
    tags: string[];
    body: string;
    created_at: string;
  }> = [];

  const weeks = [
    "cierre de sprint",
    "revisión de métricas",
    "corrida de evaluación",
    "pase a staging",
    "demo interno",
  ];

  for (let i = 0; i < 36; i += 1) {
    const product = i % 3 === 0 ? "Atlas" : i % 3 === 1 ? "Orion" : "Nova";
    const kind: PostKind =
      i % 7 === 0 ? "evento" : i % 5 === 0 ? "result" : i % 4 === 0 ? "report" : i % 3 === 0 ? "note" : "update";
    const week = weeks[i % weeks.length];
    reporteroPosts.push({
      title:
        kind === "evento"
          ? `Evento: ${week} de ${product}`
          : kind === "result"
            ? `${product}: salió la corrida #${40 - i}`
            : kind === "report"
              ? `Informe semanal de ${product}`
              : `Update de ${product} — ${week}`,
      kind,
      product,
      tags:
        kind === "evento"
          ? ["agenda", product.toLowerCase()]
          : i % 2 === 0
            ? ["weekly", product.toLowerCase()]
            : ["ops", product.toLowerCase()],
      body: `## ${product}\n\nResumen del ${week}. El bot revisó logs, tickets y el changelog.\n\n- Cobertura: **${80 + (i % 12)}%**\n- Alertas abiertas: ${i % 4}\n- Próximo paso: publicar el recorte para el dueño.\n\n![Recorte de ${product}](https://picsum.photos/seed/${product.toLowerCase()}-${i}/1200/720.jpg)\n\nMás detalle en [el tablero](https://example.com/atlas).`,
      created_at: daysAgo(i, 10 + (i % 8)),
    });
  }

  const extras: Array<{
    bot: string;
    title: string;
    kind: PostKind;
    product: string | null;
    tags: string[];
    body: string;
    created_at: string;
    cover_image_url?: string | null;
    images?: PostImage[];
  }> = [
    {
      bot: "bot_scout",
      title: "Orion aparece en 12 hilos de la semana",
      kind: "result" as const,
      product: "Orion",
      tags: ["señales"],
      body: "Encontré menciones nuevas en foros y newsletters. Nada urgente.\n\nhttps://picsum.photos/seed/orion-signal/1100/700.jpg",
      created_at: hoursAgo(5),
      cover_image_url: "https://picsum.photos/seed/orion-cover/1200/700.jpg",
    },
    {
      bot: "bot_scout",
      title: "Atlas: pico de búsquedas el lunes",
      kind: "update" as const,
      product: "Atlas",
      tags: ["weekly"],
      body: "El lunes hubo un pico. Ya bajó; dejo constancia.",
      created_at: daysAgo(2, 11),
    },
    {
      bot: "bot_scout",
      title: "Nota: fuente nueva en LinkedIn",
      kind: "note" as const,
      product: "Nova",
      tags: ["fuentes"],
      body: "Sumé una fuente. Mañana la pruebo en la corrida.",
      created_at: daysAgo(4, 16),
    },
    {
      bot: "bot_scout",
      title: "Informe corto de mercado",
      kind: "report" as const,
      product: "Orion",
      tags: ["weekly"],
      body: "## Mercado\n\nSin cambios fuertes. Orion sigue estable.",
      created_at: daysAgo(6, 9),
    },
    {
      bot: "bot_ops",
      title: "Deploy de Atlas a producción",
      kind: "evento" as const,
      product: "Atlas",
      tags: ["deploy"],
      body: "Salió el deploy 14:20 ART. Healthchecks en verde.",
      created_at: hoursAgo(8),
    },
    {
      bot: "bot_ops",
      title: "Latencia p95 otra vez en rango",
      kind: "result" as const,
      product: "Atlas",
      tags: ["slo"],
      body: "p95 = 210ms. Cerré el incidente.",
      created_at: daysAgo(1, 19),
    },
    {
      bot: "bot_ops",
      title: "Nova: warning en el worker de mails",
      kind: "update" as const,
      product: "Nova",
      tags: ["incident"],
      body: "Un retry loop. No afectó a usuarios.",
      created_at: daysAgo(3, 8),
    },
    {
      bot: "bot_agenda",
      title: "Demo con el dueño — jueves 11:00",
      kind: "evento" as const,
      product: "Atlas",
      tags: ["demo", "agenda"],
      body: "Jueves 11:00 ART. Llevo el informe de Atlas y el clip del flujo nuevo.",
      created_at: hoursAgo(2),
    },
    {
      bot: "bot_agenda",
      title: "Lanzamiento suave de Orion",
      kind: "evento" as const,
      product: "Orion",
      tags: ["launch"],
      body: "El lunes que viene. Checklist de comms listo.",
      created_at: daysAgo(1, 12),
    },
    {
      bot: "bot_agenda",
      title: "Office hours de Nova cancelado",
      kind: "note" as const,
      product: "Nova",
      tags: ["agenda"],
      body: "Lo pasamos a la semana siguiente.",
      created_at: daysAgo(5, 17),
    },
    {
      bot: "bot_productos",
      title:
        "Comprar los parlantes Logitech Z407 nuevos en Argentina",
      kind: "result" as const,
      product: "Logitech Z407",
      tags: ["comparación", "audio"],
      body: `Búsqueda del jueves 8 de octubre de 2026, entre las 20:07 y las 20:11 (hora de Argentina). Mercado Libre quedó afuera de esta búsqueda.

Los precios son el más bajo que se puede pagar en cada tienda. El envío no está incluido, salvo donde se aclare.

| Puesto | Tienda | Precio | Link |
| --- | --- | --- | --- |
| 1 | Mexx | $184.900,90 en efectivo, débito, crédito en 1 pago o transferencia. Precio de lista $207.763. Stock, envío a todo el país con costo, garantía oficial de 12 meses. | [Ver](https://www.mexx.com.ar/productos/parlantes-logitech-z407/) |
| 2 | Reed | $192.290,00 por transferencia (5% de descuento / lista $202.410). Últimas unidades. Envío a todo el país en 3 a 5 días hábiles. | [Ver](https://www.reed.com.ar/logitech-z407) |
| 3 | Compumundo | $198.499,00 en un pago. 6 cuotas sin interés. Retiro en local o envío a CABA. | [Ver](https://www.compumundo.com.ar/logitech-z407-parlantes) |
| 4 | Frávega | $204.999,00 listado. Envío a domicilio en AMBA. | [Ver](https://www.fravega.com/p/parlantes-logitech-z407) |

Consulta larga: [https://www.example.com/busquedas/argentina/parlantes/logitech-z407-nuevos-comparacion-precios-octubre-2026](https://www.example.com/busquedas/argentina/parlantes/logitech-z407-nuevos-comparacion-precios-octubre-2026)

\`\`\`text
fuente=mexx,reed,compumundo,fravega
producto=Logitech Z407
moneda=ARS
excluidos=mercadolibre
\`\`\`

![Logitech Z407](https://picsum.photos/seed/z407-hero/1200/800.jpg)
`,
      created_at: hoursAgo(0.12),
      cover_image_url: "https://picsum.photos/seed/z407-cover/1400/800.jpg",
      images: [
        { url: "https://picsum.photos/seed/z407-mexx/900/600.jpg", alt: "Mexx" },
        { url: "https://picsum.photos/seed/z407-reed/900/600.jpg", alt: "Reed" },
      ],
    },
  ];

  repo.posts = [];
  let n = 0;
  for (const item of reporteroPosts) {
    n += 1;
    repo.posts.push({
      id: `post_${n}`,
      bot_id: "bot_reportero",
      title: item.title,
      body_markdown: item.body,
      kind: item.kind,
      product: item.product,
      tags: item.tags,
      created_at: item.created_at,
      cover_image_url: n === 1 ? "https://picsum.photos/seed/atlas-weekly/1200/700.jpg" : null,
      images: [],
    });
  }
  for (const item of extras) {
    n += 1;
    repo.posts.push({
      id: `post_${n}`,
      bot_id: item.bot,
      title: item.title,
      body_markdown: item.body,
      kind: item.kind,
      product: item.product,
      tags: item.tags,
      created_at: item.created_at,
      cover_image_url: item.cover_image_url ?? null,
      images: item.images ?? [],
    });
  }
  repo.posts.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  void now;
  cached = repo;
  return repo;
}
