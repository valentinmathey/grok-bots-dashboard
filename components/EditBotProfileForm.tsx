"use client";

import { useState } from "react";
import {
  AVATAR_COLORS,
  AVATAR_PALETTE,
  AVATAR_SHAPE_LABELS,
  AVATAR_SHAPES,
  defaultAvatar,
} from "@/lib/avatar";
import { BotAvatar } from "@/components/BotAvatar";
import type { Bot } from "@/lib/types";

export function EditBotProfileForm({ bot }: { bot: Bot }) {
  const fallback = defaultAvatar(bot.slug);
  const [description, setDescription] = useState(bot.description ?? "");
  const [color, setColor] = useState(bot.avatar_color ?? fallback.color);
  const [shape, setShape] = useState(bot.avatar_shape ?? fallback.shape);
  const [avatarUrl, setAvatarUrl] = useState(bot.avatar_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    const response = await fetch(`/api/admin/bots/${bot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        avatar_color: color,
        avatar_shape: shape,
        avatar_url: avatarUrl,
      }),
    });
    const payload = (await response.json()) as { error?: { message: string } };
    setPending(false);
    if (!response.ok) {
      setError(payload.error?.message ?? "No se pudo guardar");
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div className="flex items-center gap-3">
        <BotAvatar
          bot={{
            ...bot,
            avatar_color: color,
            avatar_shape: shape,
            avatar_url: avatarUrl || null,
          }}
          size="lg"
        />
        <p className="text-xs text-muted">
          Color, forma y una foto opcional (URL externa). Si no hay foto, se
          usa la inicial.
        </p>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Descripción</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={500}
          rows={3}
          className="w-full rounded-xl border border-line bg-raised px-3 py-2 text-sm outline-none ring-accent/40 focus:ring-2"
        />
      </label>
      <div>
        <p className="mb-2 text-sm font-medium">Color</p>
        <div className="flex flex-wrap gap-1.5">
          {AVATAR_COLORS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setColor(item)}
              title={AVATAR_PALETTE[item].label}
              className={`h-8 w-8 rounded-full border-2 ${
                color === item ? "border-foreground" : "border-transparent"
              }`}
              style={{ background: AVATAR_PALETTE[item].fill }}
              aria-label={AVATAR_PALETTE[item].label}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Forma</p>
        <div className="flex flex-wrap gap-1.5">
          {AVATAR_SHAPES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setShape(item)}
              className={`rounded-full px-2.5 py-1 text-xs ${
                shape === item ? "bg-accent text-accent-ink" : "bg-chip text-muted"
              }`}
            >
              {AVATAR_SHAPE_LABELS[item]}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Foto (URL)</span>
        <input
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          type="url"
          placeholder="https://…"
          className="min-h-11 w-full rounded-xl border border-line bg-raised px-3 text-sm outline-none ring-accent/40 focus:ring-2"
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {saved ? <p className="text-sm text-accent">Guardado.</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar perfil"}
      </button>
    </form>
  );
}
