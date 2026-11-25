import { describe, expect, it } from "vitest";
import { localAvatarPath, resolveAvatar } from "./avatar";

describe("local avatars", () => {
  it("sirve PNG propio para eventos-tech-mdz", () => {
    expect(localAvatarPath("eventos-tech-mdz")).toBe("/avatars/eventos-tech-mdz.png");
    const a = resolveAvatar({
      slug: "eventos-tech-mdz",
      name: "Eventos tech Mendoza",
      avatar_url: "https://images.weserv.nl/?url=broken",
    });
    expect(a.url).toBe("/avatars/eventos-tech-mdz.png");
    expect(a.letter).toBe("E");
  });

  it("sirve PNG propio para vuelos", () => {
    expect(localAvatarPath("vuelos")).toBe("/avatars/vuelos.png");
    expect(resolveAvatar({ slug: "vuelos", name: "Vuelos" }).url).toBe("/avatars/vuelos.png");
  });

  it("deja el remoto si no hay PNG local", () => {
    expect(localAvatarPath("paraguayo-crack")).toBeNull();
    const a = resolveAvatar({
      slug: "paraguayo-crack",
      name: "Paraguayo",
      avatar_url: "https://example.com/x.png",
    });
    expect(a.url).toBe("https://example.com/x.png");
  });
});
