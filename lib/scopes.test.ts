import { describe, expect, it } from "vitest";
import { hashApiKey } from "@/lib/api-keys";
import { listCatalogEvents, listCatalogPosts } from "@/lib/catalog";
import { MemoryRepository } from "@/lib/memory-repository";
import { dispatchMcpRequest } from "@/lib/mcp";
import {
  publishPost,
  regenerateOwnedKey,
} from "@/lib/publishing";
import { canReadAll, canWrite, normalizeScopes } from "@/lib/scopes";
import { buildResumenDetails } from "@/lib/summary";

function repoWithKeys() {
  const repo = new MemoryRepository();
  const publishKey = "gb_publish_secret_key________";
  const readKey = "gb_readonly_secret_key________";
  repo.bots.push(
    {
      id: "bot_1",
      name: "n8n experto",
      slug: "n8n-experto",
      description: null,
      status: null,
      status_updated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "bot_2",
      name: "Paraguayo Crack",
      slug: "paraguayo-crack",
      description: null,
      status: null,
      status_updated_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "bot_3",
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
      botId: "bot_1",
      hash: hashApiKey(publishKey),
      prefix: "gb_publish",
      revokedAt: null,
      scopes: ["publish"],
    },
    {
      botId: "bot_1",
      hash: hashApiKey(readKey),
      prefix: "gb_readonl",
      revokedAt: null,
      scopes: ["read:all"],
    },
    {
      botId: "bot_2",
      hash: hashApiKey("gb_crack_secret_key____________"),
      prefix: "gb_crack_s",
      revokedAt: null,
      scopes: ["publish"],
    },
    {
      botId: "bot_3",
      hash: hashApiKey("gb_otro_secret_key_____________"),
      prefix: "gb_otro_se",
      revokedAt: null,
      scopes: ["publish"],
    },
  );
  return {
    repo,
    publishKey,
    readKey,
    crackKey: "gb_crack_secret_key____________",
    otherKey: "gb_otro_secret_key_____________",
  };
}

describe("scopes de API key", () => {
  it("normaliza scopes vacíos a publish", () => {
    expect(normalizeScopes(undefined)).toEqual(["publish"]);
    expect(canWrite(undefined)).toBe(true);
    expect(canReadAll(["read:all"])).toBe(true);
    expect(canWrite(["read:all"])).toBe(false);
  });

  it("read:all no publica y sí lista el catálogo; publish no lee el catálogo", async () => {
    const { repo, publishKey, readKey, otherKey } = repoWithKeys();
    const published = await publishPost(repo, `Bearer ${otherKey}`, {
      title: "Fiesta",
      body: "Hoy",
      kind: "evento",
      event_at: "2026-10-13",
    });
    expect(published.ok).toBe(true);

    const denied = await publishPost(repo, `Bearer ${readKey}`, {
      title: "No",
      body: "no",
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.status).toBe(403);
    }

    const catalog = await listCatalogPosts(repo, `Bearer ${readKey}`, {
      kind: "evento",
    });
    expect(catalog.ok).toBe(true);
    if (catalog.ok) {
      expect(catalog.data.posts).toHaveLength(1);
      expect(catalog.data.posts[0]?.bot.slug).toBe("otro");
      expect(catalog.data.posts[0]?.url).toContain("/bots/otro");
    }

    const blocked = await listCatalogPosts(repo, `Bearer ${publishKey}`, {});
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.status).toBe(403);
    }

    const events = await listCatalogEvents(repo, `Bearer ${readKey}`, {
      date: "2026-10-13",
      days: 1,
    });
    expect(events.ok).toBe(true);
    if (events.ok) {
      expect(events.data.posts.map((post) => post.title)).toEqual(["Fiesta"]);
    }
  });

  it("solo paraguayo-crack puede publicar un resumen", async () => {
    const { repo, otherKey, crackKey } = repoWithKeys();
    const forbidden = await publishPost(repo, `Bearer ${otherKey}`, {
      title: "Resumen trucho",
      body: "no",
      kind: "resumen",
    });
    expect(forbidden.ok).toBe(false);
    if (!forbidden.ok) {
      expect(forbidden.status).toBe(403);
    }

    const allowed = await publishPost(repo, `Bearer ${crackKey}`, {
      title: "Resumen ok",
      body: "sí",
      kind: "resumen",
    });
    expect(allowed.ok).toBe(true);
  });

  it("rotar la clave de publicación no revoca read:all", async () => {
    const { repo, publishKey, readKey } = repoWithKeys();
    const rotated = await regenerateOwnedKey(repo, "bot_1");
    expect(rotated.ok).toBe(true);

    const oldPublish = await publishPost(repo, `Bearer ${publishKey}`, {
      title: "Vieja",
      body: "x",
    });
    expect(oldPublish.ok).toBe(false);

    const stillReads = await listCatalogPosts(repo, `Bearer ${readKey}`, {});
    expect(stillReads.ok).toBe(true);
  });

  it("tools/list de una clave publish incluye las de audio", async () => {
    const { repo, publishKey, readKey } = repoWithKeys();
    const listed = await dispatchMcpRequest(repo, `Bearer ${publishKey}`, {
      jsonrpc: "2.0",
      id: 1,
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
      "get_audio_upload_url",
      "delete_audio",
      "set_routines",
      "list_routines",
      "list_watchlist",
      "delete_post",
      "publish_weekly_summary",
      "list_requests",
      "claim_request",
      "reply_request",
    ]);

    const readListed = await dispatchMcpRequest(repo, `Bearer ${readKey}`, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
    });
    const readTools =
      readListed.body && "result" in readListed.body
        ? (readListed.body.result as { tools: Array<{ name: string }> }).tools
        : [];
    expect(readTools.map((tool) => tool.name)).toEqual([
      "list_posts",
      "list_events",
      "search_posts",
      "list_requests",
    ]);
  });

  it("el resumen semanal no se cuenta a sí mismo", () => {
    const now = new Date("2026-10-12T14:00:00.000Z");
    const details = buildResumenDetails({
      bots: [
        {
          id: "bot_c",
          name: "Paraguayo Crack",
          slug: "paraguayo-crack",
          description: null,
          status: null,
          status_updated_at: null,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
      ],
      postsByBot: {
        bot_c: [
          {
            id: "6fc7b0c0-0000-4000-8000-000000000011",
            bot_id: "bot_c",
            title: "Resumen semanal · 2026-W41",
            body_markdown: "x",
            kind: "resumen",
            product: null,
            tags: ["resumen"],
            created_at: "2026-10-12T12:00:00.000Z",
          },
          {
            id: "6fc7b0c0-0000-4000-8000-000000000012",
            bot_id: "bot_c",
            title: "Nota",
            body_markdown: "x",
            kind: "note",
            product: null,
            tags: [],
            created_at: "2026-10-11T12:00:00.000Z",
          },
        ],
      },
      now,
    });
    expect(details.bots[0]?.new_posts).toBe(1);
  });
});
