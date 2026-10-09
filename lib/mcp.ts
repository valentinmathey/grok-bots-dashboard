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
      "Publica un post en el panel del bot (título, markdown, producto opcional, tipo y etiquetas).",
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
            "Tipo del post: slug corto en minúsculas (update, result, report, note, evento, u otro).",
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
      "Lista las publicaciones recientes de este bot, más nuevas primero. Cada post incluye id (para update_post / delete_post).",
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
        from: { type: "string", description: "Fecha inicial YYYY-MM-DD" },
        to: { type: "string", description: "Fecha final YYYY-MM-DD" },
        tag: { type: "string" },
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
      "Edita un post propio (parcial). Args: post_id y cualquiera de title, body, product, kind, tags, cover_image_url, images. Misma validación que publish_post. No toca posts de otro bot.",
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
