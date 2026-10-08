import { describe, expect, it } from "vitest";
import { defaultAvatar, resolveAvatar } from "@/lib/avatar";

describe("avatars", () => {
  it("elige color y forma deterministas por slug", () => {
    expect(defaultAvatar("productos-compra")).toEqual(
      defaultAvatar("productos-compra"),
    );
    expect(defaultAvatar("reportero")).not.toEqual(defaultAvatar("scout"));
  });

  it("usa el valor guardado y si no, el default", () => {
    const resolved = resolveAvatar({
      slug: "productos-compra",
      name: "Productos compra",
      avatar_color: "maroon",
      avatar_shape: "blob",
      avatar_url: "https://picsum.photos/seed/x/64.jpg",
    });
    expect(resolved.color).toBe("maroon");
    expect(resolved.shape).toBe("blob");
    expect(resolved.letter).toBe("P");
    expect(resolved.url).toContain("picsum");
  });
});
