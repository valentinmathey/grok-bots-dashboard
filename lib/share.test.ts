import { describe, expect, it } from "vitest";
import { hashApiKey } from "@/lib/api-keys";
import { dispatchMcpRequest } from "@/lib/mcp";
import { MemoryRepository } from "@/lib/memory-repository";
import {
  createShareLink,
  generateShareToken,
  listShareLinks,
  resolveShare,
  resolveSharedPost,
  revokeShareLink,
} from "@/lib/share";

function repoWithBots() {
  const repo = new MemoryRepository();
  const crackKey = "gb_crack_share_secret_________";
  const otherKey = "gb_otro_share_secret__________";
  repo.bots.push(
    {
      id: "bot_crack",
      name: "Paraguayo Crack",
      slug: "paraguayo-crack",
      description: null,
      status: null,
      status_updated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "bot_alo",
      name: "Alojamiento Brasil 2027",
      slug: "alojamiento-brasil-2027",
      description: "Casas en Florianópolis",
      status: null,
      status_updated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "bot_otro",
      name: "Otro",
      slug: "otro",
      description: null,
      status: null,
      status_updated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  );
  repo.keys.push(
    {
      botId: "bot_crack",
      hash: hashApiKey(crackKey),
      prefix: "gb_crack_",
      revokedAt: null,
      scopes: ["publish"],
    },
    {
      botId: "bot_otro",
      hash: hashApiKey(otherKey),
      prefix: "gb_otro_sh",
      revokedAt: null,
      scopes: ["publish"],
    },
  );
  repo.posts.push(
    {
      id: "6fc7b0c0-0000-4000-8000-000000000021",
      bot_id: "bot_alo",
      title: "Casa en Campeche",
      body_markdown: "Linda",
      kind: "alojamiento",
      product: null,
      tags: [],
      created_at: new Date().toISOString(),
      details: { city: "Florianópolis", score: 8 },
    },
    {
      id: "6fc7b0c0-0000-4000-8000-000000000022",
      bot_id: "bot_otro",
      title: "Post ajeno",
      body_markdown: "secreto",
      kind: "note",
      product: null,
      tags: [],
      created_at: new Date().toISOString(),
    },
  );
  return { repo, crackKey, otherKey };
}

describe("links para compartir", () => {
  it("solo paraguayo-crack puede crear un link; el token no ve posts de otro bot", async () => {
    const { repo, crackKey, otherKey } = repoWithBots();

    const denied = await createShareLink(repo, `Bearer ${otherKey}`, {
      bot_slug: "alojamiento-brasil-2027",
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.status).toBe(403);
    }

    const created = await createShareLink(repo, `Bearer ${crackKey}`, {
      bot_slug: "alojamiento-brasil-2027",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.data.url).toContain("/compartir/");
    const token = created.data.url.split("/compartir/")[1] ?? "";
    expect(token.length).toBeGreaterThanOrEqual(32);

    const share = await resolveShare(repo, token);
    expect(share.ok).toBe(true);
    if (share.ok) {
      expect(share.data.bot.slug).toBe("alojamiento-brasil-2027");
    }

    const own = await resolveSharedPost(
      repo,
      token,
      "6fc7b0c0-0000-4000-8000-000000000021",
    );
    expect(own.ok).toBe(true);

    const stolen = await resolveSharedPost(
      repo,
      token,
      "6fc7b0c0-0000-4000-8000-000000000022",
    );
    expect(stolen.ok).toBe(false);
    if (!stolen.ok) {
      expect(stolen.status).toBe(404);
    }

    const listed = await listShareLinks(repo, `Bearer ${crackKey}`, {
      bot_slug: "alojamiento-brasil-2027",
    });
    expect(listed.ok).toBe(true);
    if (listed.ok) {
      expect(listed.data.links).toHaveLength(1);
      expect(JSON.stringify(listed.data.links)).not.toContain(token);
    }
  });

  it("un token revocado o desconocido da 404", async () => {
    const { repo, crackKey } = repoWithBots();
    const created = await createShareLink(repo, `Bearer ${crackKey}`, {
      bot_slug: "alojamiento-brasil-2027",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const token = created.data.url.split("/compartir/")[1] ?? "";

    const revoked = await revokeShareLink(repo, `Bearer ${crackKey}`, {
      id: created.data.id,
    });
    expect(revoked.ok).toBe(true);

    const after = await resolveShare(repo, token);
    expect(after.ok).toBe(false);
    if (!after.ok) {
      expect(after.status).toBe(404);
    }

    const unknown = await resolveShare(repo, generateShareToken().token);
    expect(unknown.ok).toBe(false);
  });

  it("tools/list de otro bot no muestra las de share", async () => {
    const { repo, otherKey, crackKey } = repoWithBots();
    const listed = await dispatchMcpRequest(repo, `Bearer ${otherKey}`, {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
    });
    const tools =
      listed.body && "result" in listed.body
        ? (listed.body.result as { tools: Array<{ name: string }> }).tools
        : [];
    expect(tools.map((tool) => tool.name)).not.toContain("create_share_link");

    const crackListed = await dispatchMcpRequest(repo, `Bearer ${crackKey}`, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    });
    const crackTools =
      crackListed.body && "result" in crackListed.body
        ? (crackListed.body.result as { tools: Array<{ name: string }> }).tools
        : [];
    expect(crackTools.map((tool) => tool.name)).toContain("create_share_link");
    expect(crackTools.map((tool) => tool.name)).toContain("revoke_share_link");
    expect(crackTools.map((tool) => tool.name)).toContain("list_share_links");
  });
});

describe("links de Audios", () => {
  it("crea, resuelve y revoca un link scope audios", async () => {
    const { repo, crackKey } = repoWithBots();
    const auth = `Bearer ${crackKey}`;
    const created = await createShareLink(repo, auth, { scope: "audios", bot_slugs: ["otro"] });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.data.scope).toBe("audios");
    const token = created.data.url.split("/compartir/")[1];
    const { resolveAudiosShare } = await import("@/lib/share");
    const resolved = await resolveAudiosShare(repo, token);
    expect(resolved.ok && resolved.data.botIds).toEqual(["bot_otro"]);
    expect((await resolveShare(repo, token)).ok).toBe(false);
    const revoked = await revokeShareLink(repo, auth, { scope: "audios" });
    expect(revoked.ok && revoked.data.revoked).toBe(1);
    expect((await resolveAudiosShare(repo, token)).ok).toBe(false);
  });
});
