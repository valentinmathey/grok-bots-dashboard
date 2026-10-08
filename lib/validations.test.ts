import { describe, expect, it } from "vitest";
import {
  createBotSchema,
  createPostSchema,
  normalizeTags,
  slugify,
  updatePostFieldsSchema,
  updateStatusSchema,
} from "@/lib/validations";

describe("validaciones", () => {
  it("acepta una publicación válida y aplica defaults", () => {
    const parsed = createPostSchema.parse({
      title: "Listo el informe",
      body: "## Resumen\nTodo bien.",
    });
    expect(parsed.kind).toBe("update");
    expect(parsed.product).toBe("");
    expect(parsed.tags).toEqual([]);
  });

  it("acepta kind evento y slugs libres en minúsculas", () => {
    expect(createPostSchema.parse({
      title: "Meetup",
      body: "Hoy",
      kind: "evento",
    }).kind).toBe("evento");
    expect(createPostSchema.parse({
      title: "X",
      body: "y",
      kind: "Release",
    }).kind).toBe("release");
    expect(
      createPostSchema.safeParse({ title: "X", body: "y", kind: "Evento!" }).success,
    ).toBe(false);
  });

  it("rechaza un título vacío", () => {
    const parsed = createPostSchema.safeParse({
      title: "   ",
      body: "cuerpo",
    });
    expect(parsed.success).toBe(false);
  });

  it("permite limpiar el estado con un string vacío", () => {
    expect(updateStatusSchema.parse({ status: "" })).toEqual({ status: "" });
    expect(updateStatusSchema.safeParse({ status: "x".repeat(281) }).success).toBe(
      false,
    );
  });

  it("valida slug y datos del bot", () => {
    expect(createBotSchema.parse({ name: "Reportero", slug: "reportero" }).slug).toBe(
      "reportero",
    );
    expect(createBotSchema.safeParse({ name: "X", slug: "Mayusculas" }).success).toBe(
      false,
    );
    expect(createBotSchema.safeParse({ name: "X", slug: "-malo" }).success).toBe(
      false,
    );
  });

  it("slugify convierte nombres con acentos", () => {
    expect(slugify("Informe semanal")).toBe("informe-semanal");
    expect(slugify("  Ñandú Argentino!! ")).toBe("nandu-argentino");
  });

  it("actualiza un post en forma parcial y exige al menos un campo", () => {
    expect(updatePostFieldsSchema.parse({ title: "Nuevo" }).title).toBe("Nuevo");
    expect(updatePostFieldsSchema.safeParse({}).success).toBe(false);
    expect(
      updatePostFieldsSchema.safeParse({ cover_image_url: "javascript:x" }).success,
    ).toBe(false);
  });

  it("acepta portada y galería por URL y rechaza schemes peligrosos", () => {
    const parsed = createPostSchema.parse({
      title: "Con fotos",
      body: "Mirá",
      cover_image_url: "https://picsum.photos/seed/x/800.jpg",
      images: [{ url: "https://picsum.photos/seed/y/800.jpg", alt: "Detalle" }],
    });
    expect(parsed.cover_image_url).toContain("picsum");
    expect(parsed.images).toHaveLength(1);
    expect(
      createPostSchema.safeParse({
        title: "X",
        body: "y",
        cover_image_url: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });

  it("normaliza etiquetas", () => {
    expect(normalizeTags(["#AI", "ai", " Informe ", "informe"])).toEqual([
      "ai",
      "informe",
    ]);
  });
});
