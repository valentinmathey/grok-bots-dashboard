import { describe, expect, it } from "vitest";
import { hashApiKey } from "@/lib/api-keys";
import { MemoryRepository } from "@/lib/memory-repository";
import {
  authenticateBot,
  createOwnedBot,
  deleteOwnPost,
  listMyPosts,
  publishPost,
  publishStatus,
  regenerateOwnedKey,
  updateBotProfile,
  updateOwnPost,
} from "@/lib/publishing";

function repoWithBot() {
  const repo = new MemoryRepository();
  const key = "gb_test_clave_super_secreta";
  repo.bots.push({
    id: "bot_1",
    name: "Reportero",
    slug: "reportero",
    description: "Arma informes",
    status: "arrancando",
    status_updated_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  repo.keys.push({
    botId: "bot_1",
    hash: hashApiKey(key),
    prefix: "gb_test_cl",
    revokedAt: null,
  });
  return { repo, key };
}

describe("API de publicación", () => {
  it("rechaza requests sin Bearer", async () => {
    const repo = new MemoryRepository();
    const result = await authenticateBot(repo, null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.error.code).toBe("unauthorized");
    }
  });

  it("rechaza una clave inválida", async () => {
    const { repo } = repoWithBot();
    const result = await authenticateBot(repo, "Bearer gb_no_existe");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
    }
  });

  it("crea una publicación con la clave del bot", async () => {
    const { repo, key } = repoWithBot();
    const result = await publishPost(repo, `Bearer ${key}`, {
      title: "Corrida lista",
      body: "El modelo **terminó**.",
      kind: "result",
      product: "Atlas",
      tags: ["#weekly", "weekly"],
    });

    const evento = await publishPost(repo, `Bearer ${key}`, {
      title: "Demo del jueves",
      body: "Evento interno.",
      kind: "evento",
      product: "Atlas",
    });
    expect(evento.ok).toBe(true);
    if (evento.ok) {
      expect(evento.data.post.kind).toBe("evento");
    }

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe(201);
      expect(result.data.post.title).toBe("Corrida lista");
      expect(result.data.post.kind).toBe("result");
      expect(result.data.post.product).toBe("Atlas");
      expect(result.data.post.tags).toEqual(["weekly"]);
      expect(result.data.bot.slug).toBe("reportero");
    }
    expect(repo.posts).toHaveLength(2);
  });

  it("devuelve error JSON claro si el body es inválido", async () => {
    const { repo, key } = repoWithBot();
    const result = await publishPost(repo, `Bearer ${key}`, {
      title: "",
      body: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error.code).toBe("invalid_input");
      expect(Array.isArray(result.error.details)).toBe(true);
    }
  });

  it("actualiza el estado actual del bot", async () => {
    const { repo, key } = repoWithBot();
    const result = await publishStatus(repo, `Bearer ${key}`, {
      status: "Estoy redactando el informe de la semana",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.status).toBe(
        "Estoy redactando el informe de la semana",
      );
    }
    expect(repo.bots[0]?.status).toBe(
      "Estoy redactando el informe de la semana",
    );
  });

  it("crea un bot y luego rota la clave", async () => {
    const repo = new MemoryRepository();
    const created = await createOwnedBot(repo, {
      name: "Scout",
      slug: "scout",
      description: "Sale a buscar datos",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const firstKey = created.data.api_key;
    const firstAuth = await authenticateBot(repo, `Bearer ${firstKey}`);
    expect(firstAuth.ok).toBe(true);

    const rotated = await regenerateOwnedKey(repo, created.data.bot.id);
    expect(rotated.ok).toBe(true);
    if (!rotated.ok) {
      return;
    }

    const oldAuth = await authenticateBot(repo, `Bearer ${firstKey}`);
    const newAuth = await authenticateBot(repo, `Bearer ${rotated.data.api_key}`);
    expect(oldAuth.ok).toBe(false);
    expect(newAuth.ok).toBe(true);
  });

  it("incluye el título de la última publicación en el resumen del bot", async () => {
    const { repo, key } = repoWithBot();
    await publishPost(repo, `Bearer ${key}`, {
      title: "Logitech Z407 en Mexx",
      body: "| Puesto | Tienda |\n| --- | --- |\n| 1 | Mexx |",
    });
    const summaries = await repo.listBotSummaries();
    expect(summaries[0]?.post_count).toBe(1);
    expect(summaries[0]?.latest_title).toBe("Logitech Z407 en Mexx");
    expect(summaries[0]?.last_activity_at).toBeTruthy();
  });

  it("publica portada y galería por URL y deja actualizar el perfil", async () => {
    const { repo, key } = repoWithBot();
    const published = await publishPost(repo, `Bearer ${key}`, {
      title: "Con fotos",
      body: "![detalle](https://picsum.photos/seed/md/800.jpg)",
      cover_image_url: "https://picsum.photos/seed/cover/1200.jpg",
      images: [{ url: "https://picsum.photos/seed/g/800.jpg", alt: "Galería" }],
    });
    expect(published.ok).toBe(true);
    if (published.ok) {
      expect(published.data.post.cover_image_url).toContain("cover");
      expect(published.data.post.images?.[0]?.alt).toBe("Galería");
    }

    const profile = await updateBotProfile(repo, `Bearer ${key}`, {
      description: "Compara precios",
      avatar_color: "maroon",
      avatar_shape: "blob",
      avatar_url: "https://picsum.photos/seed/av/256.jpg",
    });
    expect(profile.ok).toBe(true);
    if (profile.ok) {
      expect(profile.data.bot.avatar_color).toBe("maroon");
      expect(profile.data.bot.description).toBe("Compara precios");
    }
  });

  it("lista las publicaciones del bot autenticado", async () => {
    const { repo, key } = repoWithBot();
    await publishPost(repo, `Bearer ${key}`, {
      title: "Uno",
      body: "a",
      product: "Atlas",
    });
    await publishPost(repo, `Bearer ${key}`, {
      title: "Dos",
      body: "b",
      product: "Orion",
    });
    const listed = await listMyPosts(repo, `Bearer ${key}`, {
      product: "Atlas",
    });
    expect(listed.ok).toBe(true);
    if (listed.ok) {
      expect(listed.data.posts).toHaveLength(1);
      expect(listed.data.posts[0]?.title).toBe("Uno");
      expect(listed.data.posts[0]?.id).toBeTruthy();
    }
  });

  it("edita y borra solo los posts propios", async () => {
    const { repo, key } = repoWithBot();
    const other = await createOwnedBot(repo, {
      name: "Otro",
      slug: "otro",
    });
    expect(other.ok).toBe(true);
    if (!other.ok) return;

    const mine = await publishPost(repo, `Bearer ${key}`, {
      title: "Mio",
      body: "original",
    });
    const theirs = await publishPost(repo, `Bearer ${other.data.api_key}`, {
      title: "Ajeno",
      body: "no tocar",
    });
    expect(mine.ok && theirs.ok).toBe(true);
    if (!mine.ok || !theirs.ok) return;

    const edited = await updateOwnPost(repo, `Bearer ${key}`, mine.data.post.id, {
      title: "Mio editado",
      kind: "report",
    });
    expect(edited.ok).toBe(true);
    if (edited.ok) {
      expect(edited.data.post.title).toBe("Mio editado");
      expect(edited.data.post.kind).toBe("report");
    }
    expect(repo.posts.find((post) => post.id === mine.data.post.id)?.body_markdown).toBe(
      "original",
    );

    const stolen = await updateOwnPost(repo, `Bearer ${key}`, theirs.data.post.id, {
      title: "Hack",
    });
    expect(stolen.ok).toBe(false);
    if (!stolen.ok) {
      expect(stolen.status).toBe(404);
    }
    expect(repo.posts.find((post) => post.id === theirs.data.post.id)?.title).toBe("Ajeno");

    const empty = await updateOwnPost(repo, `Bearer ${key}`, mine.data.post.id, {});
    expect(empty.ok).toBe(false);

    const deletedOther = await deleteOwnPost(
      repo,
      `Bearer ${key}`,
      theirs.data.post.id,
    );
    expect(deletedOther.ok).toBe(false);
    if (!deletedOther.ok) {
      expect(deletedOther.status).toBe(404);
    }

    const deleted = await deleteOwnPost(repo, `Bearer ${key}`, mine.data.post.id);
    expect(deleted.ok).toBe(true);
    expect(repo.posts.some((post) => post.id === mine.data.post.id)).toBe(false);
  });

  it("no permite slugs duplicados", async () => {
    const repo = new MemoryRepository();
    await createOwnedBot(repo, { name: "Uno", slug: "scout" });
    const second = await createOwnedBot(repo, { name: "Dos", slug: "scout" });
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.status).toBe(409);
    }
  });
});
