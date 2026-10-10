"use client";

import { useState } from "react";

const CHIPS = ["Profundizá", "Buscá más así", "Actualizá", "Otra cosa…"];

export function RequestComposer({ botId, postId }: { botId: string; postId: string }) {
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!body.trim()) return;
    await fetch("/api/admin/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bot_id: botId, post_id: postId, body }),
    });
    setBody("");
    setSent(true);
  }

  return (
    <div className="mt-2 rounded-2xl border border-dashed border-line p-3" data-no-collapse>
      <p className="text-xs font-semibold">Pedile algo al bot</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => setBody(chip === "Otra cosa…" ? "" : chip)}
            className="rounded-full bg-chip px-2.5 py-1 text-[11px] font-medium"
          >
            {chip}
          </button>
        ))}
      </div>
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={2}
        className="mt-2 w-full rounded-2xl border border-line bg-card px-3 py-2 text-sm"
        placeholder="profundizame esto…"
      />
      <button
        type="button"
        onClick={() => void submit()}
        className="mt-2 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink"
      >
        Enviar
      </button>
      {sent ? <p className="mt-1 text-xs text-muted">Listo, quedó en Pedidos.</p> : null}
    </div>
  );
}
