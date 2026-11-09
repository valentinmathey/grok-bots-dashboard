import { describe, expect, it } from "vitest";
import { imageUrlFallback, preferCompatibleImageUrl } from "./remote-image";

describe("remote-image", () => {
  it("cambia format=auto a webp en Luma", () => {
    const src =
      "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,width=800/event-social/x.png";
    expect(preferCompatibleImageUrl(src)).toContain("format=webp");
    expect(preferCompatibleImageUrl(src)).not.toContain("format=auto");
  });

  it("fallback webp→jpeg y a original", () => {
    const webp =
      "https://images.lumacdn.com/cdn-cgi/image/format=webp,fit=cover/event-social/x.png";
    expect(imageUrlFallback(webp)).toContain("format=jpeg");
    const jpeg =
      "https://images.lumacdn.com/cdn-cgi/image/format=jpeg,fit=cover/event-social/x.png";
    expect(imageUrlFallback(jpeg)).toBe(
      "https://images.lumacdn.com/event-social/x.png",
    );
  });
});
