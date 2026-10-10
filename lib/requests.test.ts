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
