import { describe, expect, it } from "vitest";
import { MemoryRepository } from "@/lib/memory-repository";
import { claimRequest, createRequest, listRequests } from "@/lib/requests";

describe("pedidos: scoping", () => {
  it("un bot no ve ni reclama el pedido de otro", async () => {
    process.env.PREVIEW_FAKE_DATA = "1";
    const a = await createRequest({ bot_id: "bot_a", body: "profundizame" });
    const listed = await listRequests({ botId: "bot_b" });
    expect(listed.find((row) => row.id === a.id)).toBeUndefined();
    const claim = await claimRequest("bot_b", a.id);
    expect(claim.ok).toBe(false);
    if (!claim.ok) expect(claim.status).toBe(404);
    const own = await claimRequest("bot_a", a.id);
    expect(own.ok).toBe(true);
    void new MemoryRepository();
  });
});

describe("pedidos: scope general vs post", () => {
  it("un pedido sin post es general y el bot lo ve con post_id null", async () => {
    process.env.PREVIEW_FAKE_DATA = "1";
    const general = await createRequest({ bot_id: "bot_g", body: "buscame eventos de IA" });
    const onPost = await createRequest({ bot_id: "bot_g", post_id: "post_1", body: "profundizá" });
    expect(general.post_id).toBeNull();
    expect(general.scope).toBe("general");
    expect(onPost.scope).toBe("post");
    const all = await listRequests({ botId: "bot_g" });
    expect(all.map((row) => row.id).sort()).toEqual([general.id, onPost.id].sort());
    const onlyGeneral = await listRequests({ botId: "bot_g", scope: "general" });
    expect(onlyGeneral.map((row) => row.id)).toEqual([general.id]);
    const claimed = await claimRequest("bot_g", general.id);
    expect(claimed.ok && claimed.data.scope).toBe("general");
  });
  it("post_id vacío se guarda como general", async () => {
    process.env.PREVIEW_FAKE_DATA = "1";
    const row = await createRequest({ bot_id: "bot_h", post_id: "", body: "revisá" });
    expect(row.post_id).toBeNull();
    expect(row.scope).toBe("general");
  });
});
