import { NextResponse } from "next/server";
import { authenticateBot } from "@/lib/publishing";
import { dispatchMcpRequest, type JsonRpcRequest } from "@/lib/mcp";
import { jsonError } from "@/lib/http";
import { createSupabaseRepository } from "@/lib/supabase/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, MCP-Protocol-Version",
};

function withCors(response: NextResponse) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  return withCors(
    jsonError(
      405,
      "method_not_allowed",
      "Este MCP es Streamable HTTP sin sesiones. Usá POST JSON-RPC en /api/mcp.",
    ),
  );
}

export async function DELETE() {
  return withCors(
    jsonError(
      405,
      "method_not_allowed",
      "Este servidor MCP es stateless: no hay sesiones para cerrar.",
    ),
  );
}

export async function POST(request: Request) {
  const repo = createSupabaseRepository();
  const authorization = request.headers.get("authorization");
  const auth = await authenticateBot(repo, authorization);
  if (!auth.ok) {
    return withCors(
      jsonError(auth.status, auth.error.code, auth.error.message, auth.error.details),
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return withCors(
      NextResponse.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: "JSON inválido" },
        },
        { status: 400 },
      ),
    );
  }

  const messages = Array.isArray(payload) ? payload : [payload];
  const responses = [];

  for (const message of messages) {
    const dispatched = await dispatchMcpRequest(
      repo,
      authorization,
      (message ?? {}) as JsonRpcRequest,
    );
    if (dispatched.body) {
      responses.push(dispatched.body);
    }
  }

  if (responses.length === 0) {
    return withCors(new NextResponse(null, { status: 202 }));
  }

  const body = Array.isArray(payload) ? responses : responses[0];
  return withCors(NextResponse.json(body));
}
