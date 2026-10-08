import { describe, expect, it } from "vitest";
import {
  createBotSchema,
  createPostSchema,
  normalizeTags,
  slugify,
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

  it("normaliza etiquetas", () => {
    expect(normalizeTags(["#AI", "ai", " Informe ", "informe"])).toEqual([
      "ai",
      "informe",
    ]);
  });
});
