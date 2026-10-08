export type PostImage = {
  url: string;
  alt: string;
};

const IMAGE_EXT_RE =
  /\.(?:avif|gif|jpe?g|png|webp|svg)(?:$|[?#])/i;

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeHttpUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }
  if (!isHttpUrl(trimmed) || trimmed.length > 2000) {
    return null;
  }
  return trimmed;
}

export function looksLikeImageUrl(value: string): boolean {
  if (!isHttpUrl(value)) {
    return false;
  }
  return IMAGE_EXT_RE.test(value);
}

export function normalizePostImages(input: unknown): PostImage[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const seen = new Set<string>();
  const images: PostImage[] = [];
  for (const item of input) {
    if (images.length >= 12) {
      break;
    }
    const url =
      typeof item === "string"
        ? normalizeHttpUrl(item)
        : normalizeHttpUrl(
            item && typeof item === "object" && "url" in item
              ? String((item as { url: unknown }).url)
              : "",
          );
    if (!url || seen.has(url)) {
      continue;
    }
    seen.add(url);
    const alt =
      item && typeof item === "object" && "alt" in item
        ? String((item as { alt: unknown }).alt ?? "").trim()
        : "";
    images.push({ url, alt: alt.slice(0, 160) });
  }
  return images;
}

export function promoteBareImageLinks(markdown: string): string {
  return markdown.replace(
    /^(https?:\/\/[^\s]+)$/gm,
    (line) => (looksLikeImageUrl(line) ? `![](${line})` : line),
  );
}

export function uniquePostMedia(post: {
  cover_image_url?: string | null;
  images?: PostImage[] | null;
}): PostImage[] {
  const seen = new Set<string>();
  const out: PostImage[] = [];
  const cover = normalizeHttpUrl(post.cover_image_url);
  if (cover) {
    seen.add(cover);
    out.push({ url: cover, alt: "Portada" });
  }
  for (const image of post.images ?? []) {
    const url = normalizeHttpUrl(image.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ url, alt: image.alt });
  }
  return out;
}
