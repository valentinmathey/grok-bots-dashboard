import { describe, expect, it } from "vitest";
import {
  looksLikeImageUrl,
  normalizeHttpUrl,
  normalizePostImages,
  promoteBareImageLinks,
} from "@/lib/images";

describe("imágenes por URL", () => {
  it("acepta http(s) y rechaza data/javascript", () => {
    expect(normalizeHttpUrl("https://picsum.photos/seed/a/800.jpg")).toBe(
      "https://picsum.photos/seed/a/800.jpg",
    );
    expect(normalizeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeHttpUrl("data:image/png;base64,xxxx")).toBeNull();
  });

  it("normaliza la galería y recorta a 12", () => {
    const images = normalizePostImages([
      { url: "https://a.example/x.png", alt: "Uno" },
      { url: "javascript:bad", alt: "No" },
      { url: "https://a.example/x.png", alt: "Dup" },
      "https://b.example/y.webp",
    ]);
    expect(images).toEqual([
      { url: "https://a.example/x.png", alt: "Uno" },
      { url: "https://b.example/y.webp", alt: "" },
    ]);
  });

  it("convierte un link pelado de imagen en markdown", () => {
    expect(looksLikeImageUrl("https://cdn.example/foto.jpg")).toBe(true);
    expect(promoteBareImageLinks("hola\nhttps://cdn.example/foto.jpg\nchau")).toBe(
      "hola\n![](https://cdn.example/foto.jpg)\nchau",
    );
  });
});
