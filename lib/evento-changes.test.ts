import { describe, expect, it } from "vitest";
import { pickEventoChanges } from "./evento-changes";
import { parsePostDetails } from "./details";
import type { Post } from "./types";

const p = (id: string, status: string | undefined, event_at: string | null) =>
  ({ id, kind: "evento", details: status ? { status } : {}, event_at, event_end_at: null, created_at: "2026-10-01T00:00:00Z" }) as unknown as Post;

describe("pickEventoChanges", () => {
  it("fija cambiados/cancelados hasta que pasa su fecha", () => {
    const now = new Date("2026-10-20T12:00:00-03:00");
    const out = pickEventoChanges(
      [
        p("a", "cancelado", "2026-11-20T19:00:00-03:00"),
        p("b", "cambiado", "2026-10-20T09:00:00-03:00"),
        p("c", "activo", "2026-11-01T19:00:00-03:00"),
        p("d", "cambiado", "2026-10-19T19:00:00-03:00"),
        p("e", undefined, "2026-11-01T19:00:00-03:00"),
        p("f", "cancelado", null),
      ],
      now,
    );
    expect(out.map((x) => x.id)).toEqual(["b", "a"]);
  });
});

describe("details de evento", () => {
  it("acepta status opcional y rechaza uno inválido", () => {
    expect(parsePostDetails("evento", { status: "cancelado", change_note: "Se suspende", luma: "x" }).ok).toBe(true);
    expect(parsePostDetails("evento", { foo: 1 }).ok).toBe(true);
    expect(parsePostDetails("evento", { status: "raro" }).ok).toBe(false);
  });
});
