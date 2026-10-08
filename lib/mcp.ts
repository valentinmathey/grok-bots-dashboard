import {
  authenticateBot,
  listMyPosts,
  publishPost,
  publishStatus,
  type BotsRepository,
} from "@/lib/publishing";
import { POST_KINDS } from "@/lib/types";

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
          enum: [...POST_KINDS],
          description: "Tipo: update, result, report o note",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Etiquetas cortas",
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
    description: "Lista las publicaciones recientes de este bot, más nuevas primero.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 50 },
        product: { type: "string" },
        kind: { type: "string", enum: [...POST_KINDS] },
        from: { type: "string", description: "Fecha inicial YYYY-MM-DD" },
        to: { type: "string", description: "Fecha final YYYY-MM-DD" },
        tag: { type: "string" },
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
