"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiKeyReveal } from "@/components/ApiKeyReveal";
import { slugify } from "@/lib/validations";

type Created = {
  slug: string;
  name: string;
  api_key: string;
};

export function CreateBotForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const response = await fetch("/api/admin/bots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, description }),
    });
    const payload = (await response.json()) as {
      bot?: { slug: string; name: string };
      api_key?: string;
      error?: { message: string };
    };

    setPending(false);

    if (!response.ok || !payload.bot || !payload.api_key) {
      setError(payload.error?.message ?? "No se pudo crear el bot");
      return;
    }

    setCreated({
      slug: payload.bot.slug,
      name: payload.bot.name,
      api_key: payload.api_key,
    });
  }

  if (created) {
    return (
      <div className="space-y-4">
        <ApiKeyReveal
          apiKey={created.api_key}
          title={`${created.name} ya tiene su clave`}
        />
        <Link
          href={`/bots/${created.slug}`}
          className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink"
        >
          Ir a la página del bot
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Nombre</span>
        <input
          value={name}
          onChange={(event) => {
            const next = event.target.value;
            setName(next);
            if (!slugTouched) {
              setSlug(slugify(next));
            }
          }}
          required
          maxLength={80}
          className="min-h-11 w-full rounded-xl border border-line bg-raised px-3 text-base outline-none ring-accent/40 focus:ring-2"
          placeholder="Reportero semanal"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Slug</span>
        <input
          value={slug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
          required
          minLength={2}
          maxLength={64}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          className="min-h-11 w-full rounded-xl border border-line bg-raised px-3 font-mono text-base sm:text-sm outline-none ring-accent/40 focus:ring-2"
          placeholder="reportero-semanal"
        />
        <span className="mt-1 block text-xs text-muted">
          Va a vivir en /bots/{slug || "…"}
        </span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Descripción</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={500}
          rows={4}
          className="w-full rounded-xl border border-line bg-raised px-3 py-2 text-base outline-none ring-accent/40 focus:ring-2"
          placeholder="Qué hace este bot y qué tipo de cosas publica."
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Creando…" : "Crear bot"}
      </button>
    </form>
  );
}
