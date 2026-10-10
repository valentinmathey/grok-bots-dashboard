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
      expect(profile.data.bot.avatar_shape).toBe("blob");
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

  it("responde 404 si el id no es un UUID (no 500)", async () => {
    const { repo, key } = repoWithBot();
    const patched = await updateOwnPost(repo, `Bearer ${key}`, "no-es-uuid", {
      title: "X",
    });
    expect(patched.ok).toBe(false);
    if (!patched.ok) {
      expect(patched.status).toBe(404);
      expect(patched.error.code).toBe("not_found");
    }

    const missing = await updateOwnPost(
      repo,
      `Bearer ${key}`,
      "00000000-0000-4000-8000-000000000099",
      { title: "X" },
    );
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.status).toBe(404);
    }

    const removed = await deleteOwnPost(repo, `Bearer ${key}`, "abc");
    expect(removed.ok).toBe(false);
    if (!removed.ok) {
      expect(removed.status).toBe(404);
    }
  });

  it("publica y lista event_at (YYYY-MM-DD es medianoche AR) y upcoming", async () => {
    const { repo, key } = repoWithBot();
    const created = await publishPost(repo, `Bearer ${key}`, {
      title: "Demo",
      body: "Hoy",
      kind: "evento",
      event_at: "2026-10-13",
      event_end_at: "2026-10-13T21:00",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.data.post.event_at).toBe("2026-10-13T03:00:00.000Z");
    expect(created.data.post.event_end_at).toBe("2026-10-14T00:00:00.000Z");

    const bad = await publishPost(repo, `Bearer ${key}`, {
      title: "Mal",
      body: "x",
      event_at: "13/10/2026",
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.status).toBe(400);
    }

    const past = await publishPost(repo, `Bearer ${key}`, {
      title: "Ya fue",
      body: "x",
      event_at: "2020-01-01T12:00:00-03:00",
    });
    expect(past.ok).toBe(true);

    const upcoming = await listMyPosts(repo, `Bearer ${key}`, { upcoming: true });
    expect(upcoming.ok).toBe(true);
    if (upcoming.ok) {
      expect(upcoming.data.posts.map((post) => post.title)).toEqual(["Demo"]);
    }

    const range = await listMyPosts(repo, `Bearer ${key}`, {
      event_from: "2026-10-13",
      event_to: "2026-10-13",
    });
    expect(range.ok).toBe(true);
    if (range.ok) {
      expect(range.data.posts).toHaveLength(1);
    }

    const cleared = await updateOwnPost(repo, `Bearer ${key}`, created.data.post.id, {
      event_at: null,
    });
    expect(cleared.ok).toBe(true);
    if (cleared.ok) {
      expect(cleared.data.post.event_at).toBeNull();
      expect(cleared.data.post.event_end_at).toBeNull();
    }
  });

  it("rechaza event_end_at anterior a event_at (compara instantes, no strings)", async () => {
    const { repo, key } = repoWithBot();
    const bad = await publishPost(repo, `Bearer ${key}`, {
      title: "Al revés",
      body: "x",
      event_at: "2026-10-13T19:00:00-03:00",
      event_end_at: "2026-10-13T21:30:00Z",
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.status).toBe(400);
    }

    const created = await publishPost(repo, `Bearer ${key}`, {
      title: "Ok",
      body: "x",
      event_at: "2026-10-13T19:00:00-03:00",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    // Postgres devuelve timestamptz con +00:00, no con Z.
    const stored = repo.posts.find((post) => post.id === created.data.post.id);
    if (stored) stored.event_at = "2026-10-13T22:00:00+00:00";
    const sameInstant = await updateOwnPost(repo, `Bearer ${key}`, created.data.post.id, {
      event_end_at: "2026-10-13T19:00:00-03:00",
    });
    expect(sameInstant.ok).toBe(true);
    const earlier = await updateOwnPost(repo, `Bearer ${key}`, created.data.post.id, {
      event_end_at: "2026-10-13T18:59:00-03:00",
    });
    expect(earlier.ok).toBe(false);
  });

  it("publica y lista details de un alojamiento", async () => {
    const { repo, key } = repoWithBot();
    const created = await publishPost(repo, `Bearer ${key}`, {
      title: "Casa en Campeche",
      body: "Floripa",
      kind: "alojamiento",
      details: {
        platform: "airbnb",
        city: "Florianópolis",
        lat: -27.6,
        lng: -48.5,
        score: 8.4,
        price_per_person: 410,
        previous_price_per_person: 500,
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.data.post.kind).toBe("alojamiento");
    expect(created.data.post.details).toMatchObject({
      city: "Florianópolis",
      score: 8.4,
    });
    expect(String(created.data.post.details?.maps_url)).toContain("google.com/maps");

    const listed = await listMyPosts(repo, `Bearer ${key}`, { kind: "alojamiento" });
    expect(listed.ok).toBe(true);
    if (listed.ok) {
      expect(listed.data.posts[0]?.details).toMatchObject({ score: 8.4 });
    }

    const patched = await updateOwnPost(repo, `Bearer ${key}`, created.data.post.id, {
      details: { score: 9.1, city: "Florianópolis" },
    });
    expect(patched.ok).toBe(true);
    if (patched.ok) {
      expect(patched.data.post.details).toMatchObject({ score: 9.1 });
    }

    const bad = await publishPost(repo, `Bearer ${key}`, {
      title: "Mal",
      body: "x",
      kind: "alojamiento",
      details: { score: 99 },
    });
    expect(bad.ok).toBe(false);
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
