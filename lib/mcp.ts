import { createAudioUploadUrl, deleteAudio } from "@/lib/audio";
import { listCatalogEvents, listCatalogPosts, searchCatalogPosts } from "@/lib/catalog";
import { botClaimRequest, botListRequests, botReplyRequest } from "@/lib/requests";
import { SUMMARY_BOT_SLUG } from "@/lib/details";
import {
  authenticateBot,
  deleteOwnPostFromMcp,
  listMyPosts,
  publishPost,
  publishStatus,
  updateBotProfile,
  updateOwnPostFromMcp,
  type BotsRepository,
} from "@/lib/publishing";
import { canReadAll, canWrite } from "@/lib/scopes";
import {
  createShareLink,
  listShareLinks,
  revokeShareLink,
} from "@/lib/share";
import { publishWeeklySummaryForBot } from "@/lib/summary";
export const MCP_PROTOCOL_VERSIONS = [
  "2024-11-05",
  "2025-03-26",
  "2025-06-18",
  "2025-11-25",
  "2026-07-28",
] as const;

export const MCP_DEFAULT_PROTOCOL = "2025-03-26";

export const MCP_TOOLS = [
  {
    name: "publish_post",
    description:
      "Publica un post en el panel del bot (título, markdown, producto opcional, tipo, etiquetas, fecha de evento y details JSON). kind=alojamiento, resumen, oportunidades, ranking, newsletter, informe o workflow validan details; otros kinds aceptan un objeto libre (máx. 40 claves / 32 KB) o lo omiten. kind=oportunidades es un lote y exige details.items (1–60). kind=ranking exige product_name; kind=workflow exige workflow_name. Un report con product_name+offers[] se valida como ranking.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "body"],
      properties: {
        title: { type: "string", description: "Título corto del post" },
        body: {
          type: "string",
          description: "Cuerpo en Markdown",
        },
        product: {
          type: "string",
          description: "Nombre del producto al que refiere el post",
        },
        kind: {
          type: "string",
          description:
            "Tipo del post: slug corto en minúsculas (update, result, report, note, evento, alojamiento, resumen, oportunidades, ranking, newsletter, informe, workflow, u otro).",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Etiquetas cortas",
        },
        audio_url: {
          type: ["string", "null"],
          description:
            "URL pública del audio (la que devuelve get_audio_upload_url). Se muestra con reproductor y botón Descargar. Null/\"\" lo quita.",
        },
        audio_duration_seconds: {
          type: ["integer", "null"],
          description: "Duración del audio en segundos (opcional).",
        },
        cover_image_url: {
          type: "string",
          description: "URL http(s) de una imagen de portada (sin subir archivos)",
        },
        images: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["url"],
            properties: {
              url: { type: "string", description: "URL http(s) de la imagen" },
              alt: { type: "string", description: "Texto alternativo" },
            },
          },
          description: "Galería de imágenes por URL (máximo 12). No hay uploads.",
        },
        event_at: {
          type: "string",
          description:
            "Inicio del evento. ISO 8601 o YYYY-MM-DD (se interpreta en America/Argentina/Buenos_Aires). Null para limpiar.",
        },
        event_end_at: {
          type: "string",
          description:
            "Fin opcional del evento (ISO 8601 o YYYY-MM-DD, hora Argentina). Para eventos de varios días.",
        },
        details: {
          type: "object",
          description:
            "JSON estructurado. Claves desconocidas se descartan. alojamiento (todos opcionales): platform (airbnb|booking|otro), listing_url, search_area, neighborhood, city, address, lat, lng, maps_url, check_in, check_out (YYYY-MM-DD), nights, guests, capacity, bedrooms, beds, bathrooms, property_type, is_combination, units[{name,url,capacity,price}], price_total, price_per_person, price_per_night, currency, price_as_shown, cleaning_fee, service_fee, rating (0-5), reviews_count, superhost, badges[], distance_to_beach (m), amenities[] (pool,parking,wifi,ac,grill,kitchen,washer,sea_view,pet_friendly,tv,heating,workspace,beach_access), includes[], excludes[], cancellation, pros[], cons[], score (0-10 precio-calidad), rank, last_checked_at, previous_price_total, previous_price_per_person. resumen: week_key (YYYY-Www), period_from, period_to, generated_at, bots[{bot_id,name,slug,avatar_color,avatar_url,status,new_posts,upcoming_events[{title,event_at,event_end_at,post_id}],alojamientos{new_count,best,cheapest,price_drops[{title,post_id,score,price_per_person,price_total,currency,from,to}]},oportunidades{open_count,recommended_count,next_deadlines[{name,deadline,category,post_id,prize_text}]},products[{name,posts}]}]. oportunidades (un lote): period_label? (≤80), items[] requerido 1–60, cada item: name requerido ≤160, url requerido http(s), category enum hackaton|bounty|beca|curso|grant|creditos|concurso|empleo|freelance|oferta|otro, organization? ≤120, prize_text? ≤120 (tal cual en la fuente: premio/sueldo/precio), prize_value? number + prize_currency? ≤8 (para ordenar), deadline? YYYY-MM-DD o ISO (hora Argentina, como event_at), modality? online|presencial|hibrido, location? ≤120, effort? bajo|medio|alto, effort_text? ≤80, how_to? ≤280, recommended? boolean, tags? ≤8 strings, image_url? http(s), notes? ≤280. Ejemplo: {\"period_label\":\"Martes 13/10\",\"items\":[{\"name\":\"ETHGlobal Buenos Aires\",\"url\":\"https://ethglobal.com/events/buenosaires\",\"category\":\"hackaton\",\"organization\":\"ETHGlobal\",\"prize_text\":\"US$ 100k\",\"prize_value\":100000,\"prize_currency\":\"USD\",\"deadline\":\"2026-10-20\",\"modality\":\"presencial\",\"location\":\"CABA\",\"effort\":\"alto\",\"how_to\":\"Armá equipo de 3 y mandá el repo el viernes.\",\"recommended\":true}]}. ranking (también un report con product_name+offers[]): product_name req ≤160, product_image_url?, category?, query?, currency?, offers[{store req, url http(s) req, price number req, price_as_shown?, original_price?, discount_pct?, shipping_text?, shipping_cost?, installments_text?, in_stock?, seller_rating 0-5, condition nuevo|usado|reacondicionado, notes?, rank?}] ≤30, best_offer_index?, verdict? ≤280, score 0-10, price_history[{date YYYY-MM-DD, best_price}] ≤60, previous_best_price?, checked_at?. Ejemplo ranking: {\"product_name\":\"Logitech Z407\",\"currency\":\"ARS\",\"previous_best_price\":210000,\"offers\":[{\"store\":\"Mexx\",\"url\":\"https://www.mexx.com.ar/z407\",\"price\":184900.9,\"installments_text\":\"1 pago\",\"in_stock\":true}]}. newsletter: edition_date YYYY-MM-DD, edition_number, headline ≤200, tldr[] ≤8, sections[{title req, icon ai|cloud|security|dev|startups|hardware|open-source|mobile|web|data|other, items[{title req, url?, source?, summary ≤400, why_it_matters ≤200, image_url?, tags[]}] ≤15}] ≤10, reading_minutes, quote{text, author?}. informe (todos opcionales, backward compatible): date YYYY-MM-DD, summary_simple ≤600, summary_technical ≤2000 markdown, indicators[{key req, label?, value req number, unit?, buy?, sell?, change_abs?, change_pct?, direction up|down|flat, source?, as_of?}] ≤30, brecha_pct, highlights[] ≤8, risks[] ≤8, outlook ≤400, sources[{name, url?, section? dia_en_3_lineas|dolar_simple|vs_inflacion|idea_prudente|tecnica_sueldo|referentes|palabra_del_dia|inflation|rates|ideas|assets|agenda|highlights|risks|outlook|disclaimer|otras_secciones}] ≤40, dia_en_3_lineas{lines[] 1–3}, dolar_simple{text}, vs_inflacion{verdict si|no|empata, example_amount, inflation_pct, options[{name, monthly_rate_pct, result_amount}] ≤8}, idea_prudente{title, text, risk bajo|medio|alto, link?}, tecnica_sueldo{name, description, allocation[{label, pct}] 1–8, example?{salary, breakdown[{label, amount}]}, link?}, referentes[{name, role?, platform x|instagram|youtube|tiktok|nota, summary, date YYYY-MM-DD, url http(s) req, pinned?}] ≤20, palabra_del_dia{term, definition, link?}, inflation{month, monthly_pct, yoy_pct, ytd_pct, rem_next_pct?, next_release_date YYYY-MM-DD}, rates[{instrument, provider, tna_pct, monthly_pct, beats_inflation?, term?, risk, link?}] ≤20, ideas[{name, what_it_is, profile conservador|moderado|arriesgado, expected_return?, risk, how_to, link?}] ≤12, assets[{ticker, name, type bono|accion|cedear, price, currency, change_pct, note?}] ≤30, agenda[{date YYYY-MM-DD, time?, title, description?, link?}] ≤20, disclaimer ≤400, otras_secciones[{titulo, icono?, markdown}] ≤8. workflow: workflow_name req ≤160, workflow_url?, status active|inactive|draft|error, trigger_type (webhook|schedule|telegram|manual|email|other), trigger_detail?, schedule_text?, nodes[{name, type?}] ≤40, services[] ≤20, purpose ≤400, steps[] ≤20, inputs?, outputs?, credentials_needed[] (nombres, nunca valores), last_run_at?, last_run_status success|error|running, runs_7d, errors_7d, version?, json_url?, notes?. Ejemplo workflow: {\"workflow_name\":\"Digest Telegram\",\"status\":\"active\",\"trigger_type\":\"schedule\",\"services\":[\"telegram\",\"openai\"]}. ranking/workflow con details vacíos fallan; newsletter/informe vacíos se aceptan y se renderizan como card estándar. Otros kinds: objeto libre.",
        },
      },
    },
  },
  {
    name: "update_status",
    description: "Actualiza el campo 'en qué está' del bot en el dashboard.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["status"],
      properties: {
        status: {
          type: "string",
          description: "Qué está haciendo el bot ahora. Vacío para limpiar.",
        },
      },
    },
  },
  {
    name: "list_my_posts",
    description:
      "Lista las publicaciones recientes de este bot, más nuevas primero. Cada post incluye id, event_at, event_end_at y details (para update_post / delete_post).",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 50 },
        product: { type: "string" },
        kind: {
          type: "string",
          description: "Slug del tipo (ej. evento, report)",
        },
        from: { type: "string", description: "Fecha de publicación inicial YYYY-MM-DD" },
        to: { type: "string", description: "Fecha de publicación final YYYY-MM-DD" },
        tag: { type: "string" },
        event_from: {
          type: "string",
          description: "Filtra por fecha de evento desde YYYY-MM-DD (hora Argentina)",
        },
        event_to: {
          type: "string",
          description: "Filtra por fecha de evento hasta YYYY-MM-DD (hora Argentina)",
        },
        upcoming: {
          type: "boolean",
          description:
            "true = solo eventos próximos (event_at >= hoy AR o event_end_at >= ahora). false = solo pasados.",
        },
      },
    },
  },
  {
    name: "update_profile",
    description:
      "Actualiza la descripción y el avatar del bot (color y URL de foto externa). El avatar siempre es redondo. avatar_shape se acepta por compatibilidad pero se ignora al mostrar. No sube archivos.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        description: { type: "string", description: "Qué hace el bot" },
        avatar_color: {
          type: "string",
          description:
            "maroon, black, brown, red, orange, yellow, green, cyan, blue, violet, magenta, gray",
        },
        avatar_shape: {
          type: "string",
          description:
            "Deprecated: se acepta por compatibilidad (blob, squircle, hex, star, heart, shield, diamond, petal) pero el panel siempre muestra un círculo.",
        },
        avatar_url: {
          type: "string",
          description: "URL http(s) de una foto. Vacío para quitarla.",
        },
      },
    },
  },
  {
    name: "update_post",
    description:
      "Edita un post propio (parcial). Args: post_id y cualquiera de title, body, product, kind, tags, cover_image_url, images, event_at, event_end_at, details. Misma validación que publish_post. Null en event_at limpia la fecha. No toca posts de otro bot.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["post_id"],
      properties: {
        post_id: { type: "string", description: "Id del post (sale de list_my_posts)" },
        title: { type: "string" },
        body: { type: "string", description: "Cuerpo en Markdown" },
        product: { type: "string" },
        kind: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        audio_url: {
          type: ["string", "null"],
          description:
            "URL pública del audio (la que devuelve get_audio_upload_url). Se muestra con reproductor y botón Descargar. Null/\"\" lo quita.",
        },
        audio_duration_seconds: {
          type: ["integer", "null"],
          description: "Duración del audio en segundos (opcional).",
        },
        cover_image_url: { type: "string" },
        event_at: {
          type: "string",
          description: "ISO 8601 o YYYY-MM-DD (hora Argentina). Null limpia.",
        },
        event_end_at: {
          type: "string",
          description: "Fin opcional del evento. Null limpia.",
        },
        details: {
          type: "object",
          description:
            "Mismo schema que publish_post. Se valida según kind (nuevo o el actual).",
        },
        images: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["url"],
            properties: {
              url: { type: "string" },
              alt: { type: "string" },
            },
          },
        },
      },
    },
  },
  {
    name: "get_audio_upload_url",
    description:
      "Crea una URL firmada para subir un audio (mp3/m4a/aac/ogg/opus/webm, máx 20 MB) al bucket post-audio. Devuelve path, url (pública, para audio_url), upload_url y token. Subí con PUT upload_url, header Content-Type del audio y el archivo como body (válida 2 h). Después publicá/editá el post con audio_url=url.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        filename: { type: "string", description: "Nombre original (se usa la extensión)" },
        ext: { type: "string", description: "mp3 (default), m4a, aac, ogg, opus o webm" },
        content_type: { type: "string", description: "audio/mpeg, audio/mp4, ..." },
      },
    },
  },
  {
    name: "delete_audio",
    description:
      "Borra audios propios del bucket post-audio. Args: path (slug/YYYY-MM/archivo), paths[] o month (YYYY-MM, borra todos los de ese mes de este bot). Pensado para la limpieza mensual.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        path: { type: "string" },
        paths: { type: "array", items: { type: "string" } },
        month: { type: "string", description: "YYYY-MM" },
      },
    },
  },
  {
    name: "set_routines",
    description:
      "Reemplaza la lista completa de rutinas de este bot (qué publica y cuándo), máx 20. Mandá [] para borrarlas. Se ven en la sección Rutinas del dashboard.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["routines"],
      properties: {
        routines: {
          type: "array",
          maxItems: 20,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "schedule_text", "summary"],
            properties: {
              name: { type: "string", description: "Nombre corto de la rutina" },
              schedule_text: { type: "string", description: "Horario legible, ej. \"Lun a vie 08:15\"" },
              cron: { type: "string", description: "Cron de 5 campos opcional, ej. \"15 8 * * 1-5\"" },
              timezone: { type: "string", description: "Zona IANA, default America/Mendoza" },
              summary: { type: "string", description: "Qué publica, corto (máx 500)" },
              kind: { type: "string", description: "Kind de post que publica (opcional)" },
              enabled: { type: "boolean", description: "Default true; false = pausada" },
            },
          },
        },
      },
    },
  },
  {
    name: "list_routines",
    description: "Lista las rutinas declaradas por este bot.",
    inputSchema: { type: "object", additionalProperties: false, properties: {} },
  },
  {
    name: "delete_post",
    description: "Borra un post propio. Args: post_id. Si no es de este bot, responde 404.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["post_id"],
      properties: {
        post_id: { type: "string" },
      },
    },
  },
  {
    name: "publish_weekly_summary",
    description:
      "Genera (o actualiza) el resumen semanal kind=resumen en el panel de paraguayo-crack. Solo esa clave. Idempotente por week_key (YYYY-Www, semana ISO en hora Argentina). No pide args.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
  },
  {
    name: "list_requests",
    description:
      "Lista pedidos al bot (pendiente/en_progreso/respondido/descartado). Conviene chequearlos al arrancar cada corrida. Cada pedido trae scope: 'post' (atado a un post, post_id) o 'general' (pedido general al bot, post_id null). Args: status?, scope? (general|post).",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        status: { type: "string" },
        scope: { type: "string", enum: ["general", "post"] },
      },
    },
  },
  {
    name: "claim_request",
    description: "Marca un pedido propio como en_progreso. Args: id.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["id"],
      properties: { id: { type: "string" } },
    },
  },
  {
    name: "reply_request",
    description:
      "Responde un pedido propio. Args: id, body markdown, linked_post_id?, status? (default respondido).",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["id", "body"],
      properties: {
        id: { type: "string" },
        body: { type: "string" },
        linked_post_id: { type: "string" },
        status: { type: "string" },
      },
    },
  },
] as const;

export const MCP_READ_TOOLS = [
  {
    name: "list_posts",
    description:
      "Lista publicaciones de TODOS los bots (solo claves con scope read:all). Filtros: kind, bot (slug), event_from/event_to, upcoming, from/to (fecha de publicación), q (título/cuerpo), limit (default 50, máx. 200), cursor/offset. Orden: event_at asc si hay filtros de evento; si no, created_at desc. Cada post incluye bot {slug,name}, url del panel, details.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        kind: { type: "string" },
        bot: { type: "string", description: "Slug del bot" },
        event_from: {
          type: "string",
          description: "Fecha de evento desde YYYY-MM-DD (hora Argentina)",
        },
        event_to: {
          type: "string",
          description: "Fecha de evento hasta YYYY-MM-DD (hora Argentina)",
        },
        upcoming: {
          type: "boolean",
          description:
            "true = solo eventos próximos. false = solo pasados.",
        },
        from: { type: "string", description: "Publicados desde YYYY-MM-DD" },
        to: { type: "string", description: "Publicados hasta YYYY-MM-DD" },
        q: { type: "string", description: "Busca en título y cuerpo" },
        limit: { type: "integer", minimum: 1, maximum: 200 },
        offset: { type: "integer", minimum: 0 },
        cursor: { type: "string", description: "Alias numérico de offset" },
      },
    },
  },
  {
    name: "list_events",
    description:
      "Atajo para eventos (kind=evento) de todos los bots. date=YYYY-MM-DD (default hoy ART) y days=N (ventana inclusiva). Solo claves read:all. Útil para «qué eventos hay hoy».",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        date: {
          type: "string",
          description: "Día inicial YYYY-MM-DD (hora Argentina). Default: hoy.",
        },
        days: {
          type: "integer",
          minimum: 1,
          maximum: 31,
          description: "Cantidad de días inclusive desde date. Default 1.",
        },
        bot: { type: "string", description: "Slug del bot" },
        q: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 200 },
        offset: { type: "integer", minimum: 0 },
        cursor: { type: "string" },
      },
    },
  },
  {
    name: "search_posts",
    description:
      "Busca posts de todos los bots (título, cuerpo, producto, tags y details). Solo claves read:all. Args: q (req, ≥2), bots[]/bot, kinds[]/kind, from, to, sort=relevance|newest, favorites (reservado), limit, offset.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["q"],
      properties: {
        q: { type: "string", description: "Texto a buscar (sin acento también sirve)" },
        bot: { type: "string" },
        bots: { type: "array", items: { type: "string" } },
        kind: { type: "string" },
        kinds: { type: "array", items: { type: "string" } },
        from: { type: "string" },
        to: { type: "string" },
        sort: { type: "string", description: "relevance | newest" },
        favorites: { type: "boolean" },
        limit: { type: "integer", minimum: 1, maximum: 50 },
        offset: { type: "integer", minimum: 0 },
      },
    },
  },
  {
    name: "list_requests",
    description:
      "Lista pedidos (solo lectura) visibles para esta clave, con scope 'post' o 'general' (post_id null). read:all no puede claim/reply. Args: status?, scope? (general|post).",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        status: { type: "string" },
        scope: { type: "string", enum: ["general", "post"] },
      },
    },
  },
] as const;

export const MCP_SHARE_TOOLS = [
  {
    name: "create_share_link",
    description:
      "Crea un link público de solo lectura para un bot (ej. alojamiento-brasil-2027). Solo la clave de paraguayo-crack. Devuelve la URL una sola vez. Args: bot_slug.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["bot_slug"],
      properties: {
        bot_slug: {
          type: "string",
          description: "Slug del bot a compartir",
        },
      },
    },
  },
  {
    name: "revoke_share_link",
    description:
      "Revoca un link público. Mandá id (un link) o bot_slug (todos los activos de ese bot). Solo paraguayo-crack.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        bot_slug: { type: "string" },
        id: { type: "string", description: "UUID del link" },
      },
    },
  },
  {
    name: "list_share_links",
    description:
      "Lista links para compartir (id, bot, prefijo, created_at, revoked_at). Nunca devuelve el token. Solo paraguayo-crack. Args opcionales: bot_slug.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        bot_slug: { type: "string" },
      },
    },
  },
] as const;

export function toolsForScopes(scopes?: string[] | null) {
  const write = canWrite(scopes);
  const read = canReadAll(scopes);
  if (write && read) {
    return [...MCP_TOOLS, ...MCP_READ_TOOLS];
  }
  if (read) {
    return [...MCP_READ_TOOLS];
  }
  return [...MCP_TOOLS];
}

export function toolsForBot(bot: { slug?: string; scopes?: string[] | null }) {
  const scoped = toolsForScopes(bot.scopes);
  if (canWrite(bot.scopes) && bot.slug === SUMMARY_BOT_SLUG) {
    return [...scoped, ...MCP_SHARE_TOOLS];
  }
  return scoped;
}

type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method?: string;
  params?: unknown;
};

export type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

function isNotification(request: JsonRpcRequest): boolean {
  return request.id === undefined;
}

function ok(id: JsonRpcId, result: unknown): JsonRpcResponse {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

function toolText(data: unknown, isError = false) {
  return {
    content: [
      {
        type: "text",
        text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
      },
    ],
    isError,
  };
}

async function callTool(
  repo: BotsRepository,
  authorization: string | null,
  name: string,
  args: unknown,
) {
  switch (name) {
    case "publish_post":
      return publishPost(repo, authorization, args ?? {});
    case "update_status":
      return publishStatus(repo, authorization, args ?? {});
    case "list_my_posts":
      return listMyPosts(repo, authorization, args ?? {});
    case "update_profile":
      return updateBotProfile(repo, authorization, args ?? {});
    case "update_post":
      return updateOwnPostFromMcp(repo, authorization, args ?? {});
    case "delete_post":
      return deleteOwnPostFromMcp(repo, authorization, args ?? {});
    case "get_audio_upload_url":
      return createAudioUploadUrl(repo, (await import("@/lib/audio-storage")).getAudioStorage(), authorization, args ?? {});
    case "set_routines":
      return (await import("@/lib/routines")).botSetRoutines(repo, authorization, args ?? {});
    case "list_routines":
      return (await import("@/lib/routines")).botGetRoutines(repo, authorization);
    case "delete_audio":
      return deleteAudio(repo, (await import("@/lib/audio-storage")).getAudioStorage(), authorization, args ?? {});
    case "publish_weekly_summary":
      return publishWeeklySummaryForBot(repo, authorization);
    case "list_posts":
      return listCatalogPosts(repo, authorization, args ?? {});
    case "list_events":
      return listCatalogEvents(repo, authorization, args ?? {});
    case "search_posts":
      return searchCatalogPosts(repo, authorization, args ?? {});
    case "list_requests":
      return botListRequests(repo, authorization, args ?? {});
    case "claim_request":
      return botClaimRequest(repo, authorization, String((args as { id?: string })?.id ?? ""));
    case "reply_request":
      return botReplyRequest(
        repo,
        authorization,
        String((args as { id?: string })?.id ?? ""),
        args ?? {},
      );
    case "create_share_link":
      return createShareLink(repo, authorization, args ?? {});
    case "revoke_share_link":
      return revokeShareLink(repo, authorization, args ?? {});
    case "list_share_links":
      return listShareLinks(repo, authorization, args ?? {});
    default:
      return {
        ok: false as const,
        status: 404,
        error: { code: "not_found", message: `Herramienta desconocida: ${name}` },
      };
  }
}

export async function dispatchMcpRequest(
  repo: BotsRepository,
  authorization: string | null,
  request: JsonRpcRequest,
): Promise<{ status: number; body: JsonRpcResponse | null }> {
  if (request.jsonrpc !== "2.0" || typeof request.method !== "string") {
    return {
      status: 200,
      body: rpcError(request.id ?? null, -32600, "Pedido JSON-RPC inválido"),
    };
  }

  if (isNotification(request)) {
    return { status: 202, body: null };
  }

  const id = request.id ?? null;

  switch (request.method) {
    case "initialize": {
      const params = (request.params ?? {}) as { protocolVersion?: string };
      const requested = params.protocolVersion;
      const protocolVersion = MCP_PROTOCOL_VERSIONS.includes(
        requested as (typeof MCP_PROTOCOL_VERSIONS)[number],
      )
        ? requested
        : MCP_DEFAULT_PROTOCOL;

      return {
        status: 200,
        body: ok(id, {
          protocolVersion,
          capabilities: { tools: { listChanged: false } },
          serverInfo: {
            name: "grok-bots-dashboard",
            version: "0.1.0",
            title: "Grok Bots",
          },
          instructions:
            "Publicá resultados en el dashboard privado del dueño. Autenticá con Authorization: Bearer <API_KEY> del bot.",
        }),
      };
    }
    case "ping":
      return { status: 200, body: ok(id, {}) };
    case "tools/list": {
      const auth = await authenticateBot(repo, authorization);
      const tools = auth.ok ? toolsForBot(auth.data) : [...MCP_TOOLS];
      return { status: 200, body: ok(id, { tools }) };
    }
    case "tools/call": {
      const params = (request.params ?? {}) as {
        name?: string;
        arguments?: unknown;
      };
      if (!params.name) {
        return {
          status: 200,
          body: rpcError(id, -32602, "Falta params.name"),
        };
      }

      const auth = await authenticateBot(repo, authorization);
      if (!auth.ok) {
        return {
          status: 200,
          body: ok(id, toolText(auth.error, true)),
        };
      }

      const allowed = toolsForBot(auth.data).some(
        (tool) => tool.name === params.name,
      );
      if (!allowed) {
        return {
          status: 200,
          body: ok(
            id,
            toolText(
              {
                code: "forbidden",
                message: "Esta clave no tiene permiso para esa herramienta",
              },
              true,
            ),
          ),
        };
      }

      const result = await callTool(
        repo,
        authorization,
        params.name,
        params.arguments,
      );
      if (!result.ok) {
        return {
          status: 200,
          body: ok(id, toolText(result.error, true)),
        };
      }
      return { status: 200, body: ok(id, toolText(result.data)) };
    }
    case "resources/list":
      return { status: 200, body: ok(id, { resources: [] }) };
    case "prompts/list":
      return { status: 200, body: ok(id, { prompts: [] }) };
    default:
      return {
        status: 200,
        body: rpcError(id, -32601, `Método no soportado: ${request.method}`),
      };
  }
}
