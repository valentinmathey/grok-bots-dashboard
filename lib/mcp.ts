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
      "Publica un post en el panel del bot (título, markdown, producto opcional, tipo, etiquetas, fecha de evento y details JSON). kind=alojamiento o resumen validan details; otros kinds aceptan un objeto libre (máx. 40 claves / 32 KB) o lo omiten.",
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
            "Tipo del post: slug corto en minúsculas (update, result, report, note, evento, alojamiento, resumen, u otro).",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Etiquetas cortas",
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
            "JSON estructurado. alojamiento (todos opcionales): platform (airbnb|booking|otro), listing_url, search_area, neighborhood, city, address, lat, lng, maps_url, check_in, check_out (YYYY-MM-DD), nights, guests, capacity, bedrooms, beds, bathrooms, property_type, is_combination, units[{name,url,capacity,price}], price_total, price_per_person, price_per_night, currency, price_as_shown, cleaning_fee, service_fee, rating (0-5), reviews_count, superhost, badges[], distance_to_beach (m), amenities[] (pool,parking,wifi,ac,grill,kitchen,washer,sea_view,pet_friendly,tv,heating,workspace,beach_access), includes[], excludes[], cancellation, pros[], cons[], score (0-10 precio-calidad), rank, last_checked_at, previous_price_total, previous_price_per_person. resumen: week_key (YYYY-Www), period_from, period_to, generated_at, bots[{bot_id,name,slug,avatar_color,avatar_url,status,new_posts,upcoming_events[{title,event_at,event_end_at,post_id}],alojamientos{new_count,best,cheapest,price_drops[{title,post_id,score,price_per_person,price_total,currency,from,to}]},products[{name,posts}]}]. Otros kinds: objeto libre.",
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
] as const;

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
    case "publish_weekly_summary":
      return publishWeeklySummaryForBot(repo, authorization);
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
    case "tools/list":
      return { status: 200, body: ok(id, { tools: MCP_TOOLS }) };
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
