import { describe, expect, it } from "vitest";
import { hashApiKey } from "@/lib/api-keys";
import { dispatchMcpRequest } from "@/lib/mcp";
import { MemoryRepository } from "@/lib/memory-repository";

function repoWithBot() {
  const repo = new MemoryRepository();
  const key = "gb_mcp_secret";
  repo.bots.push({
    id: "bot_1",
    name: "Reportero",
    slug: "reportero",
    description: null,
    status: null,
    status_updated_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  repo.keys.push({
    botId: "bot_1",
    hash: hashApiKey(key),
    prefix: "gb_mcp_sec",
    revokedAt: null,
  });
  return { repo, authorization: `Bearer ${key}` };
}

describe("MCP Streamable HTTP", () => {
  it("inicializa y lista las herramientas", async () => {
    const { repo, authorization } = repoWithBot();
    const init = await dispatchMcpRequest(repo, authorization, {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-03-26" },
    });
    expect(init.body && "result" in init.body).toBe(true);

    const listed = await dispatchMcpRequest(repo, authorization, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    });
    const tools =
      listed.body && "result" in listed.body
        ? (listed.body.result as { tools: Array<{ name: string }> }).tools
        : [];
    expect(tools.map((tool) => tool.name)).toEqual([
      "publish_post",
      "update_status",
      "list_my_posts",
      "update_profile",
      "update_post",
      "delete_post",
    ]);
    expect(tools.map((tool) => tool.name)).not.toContain("upload_image");
  });

  it("publica, actualiza estado y lista posts", async () => {
    const { repo, authorization } = repoWithBot();

    const published = await dispatchMcpRequest(repo, authorization, {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "publish_post",
        arguments: {
          title: "Via MCP",
          body: "Salida **ok**",
          product: "Atlas",
          kind: "result",
          tags: ["mcp"],
        },
      },
    });
    expect(published.body && "error" in published.body && published.body.error).toBeFalsy();
    expect(repo.posts[0]?.product).toBe("Atlas");

    await dispatchMcpRequest(repo, authorization, {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "update_status",
        arguments: { status: "Publicando por MCP" },
      },
    });
    expect(repo.bots[0]?.status).toBe("Publicando por MCP");

    const listed = await dispatchMcpRequest(repo, authorization, {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "list_my_posts",
        arguments: { product: "Atlas" },
      },
    });
    const text =
      listed.body && "result" in listed.body
        ? (
            listed.body.result as {
              content: Array<{ text: string }>;
            }
          ).content[0]?.text
        : "";
    expect(text).toContain("Via MCP");
    expect(text).toContain("Atlas");
    expect(text).toContain('"id"');

    const postId = repo.posts[0]?.id;
    expect(postId).toBeTruthy();
    const updated = await dispatchMcpRequest(repo, authorization, {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "update_post",
        arguments: { post_id: postId, title: "Via MCP editado" },
      },
    });
    expect(updated.body && "error" in updated.body && updated.body.error).toBeFalsy();
    expect(repo.posts[0]?.title).toBe("Via MCP editado");

    const removed = await dispatchMcpRequest(repo, authorization, {
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: { name: "delete_post", arguments: { post_id: postId } },
    });
    expect(removed.body && "error" in removed.body && removed.body.error).toBeFalsy();
    expect(repo.posts).toHaveLength(0);
  });

  it("devuelve isError si la herramienta falla la validación", async () => {
    const { repo, authorization } = repoWithBot();
    const result = await dispatchMcpRequest(repo, authorization, {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: { name: "publish_post", arguments: { title: "" } },
    });
    const payload = result.body?.result as { isError?: boolean };
    expect(payload.isError).toBe(true);
  });

  it("update_post y delete_post no explotan con un id inválido", async () => {
    const { repo, authorization } = repoWithBot();
    const updated = await dispatchMcpRequest(repo, authorization, {
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "update_post",
        arguments: { post_id: "no-es-uuid", title: "X" },
      },
    });
    const updatePayload = updated.body?.result as {
      isError?: boolean;
      content?: Array<{ text: string }>;
    };
    expect(updatePayload.isError).toBe(true);
    expect(updatePayload.content?.[0]?.text).toContain("not_found");

    const removed = await dispatchMcpRequest(repo, authorization, {
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: { name: "delete_post", arguments: { post_id: "tampoco" } },
    });
    const deletePayload = removed.body?.result as { isError?: boolean };
    expect(deletePayload.isError).toBe(true);
  });
});
