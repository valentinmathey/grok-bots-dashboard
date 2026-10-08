"use client";

import { useState } from "react";
import { requestMagicLink } from "@/app/login/actions";

export function LoginForm({
  initialError,
}: {
  initialError?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError ?? null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await requestMagicLink(email);
    setPending(false);
    if (result.ok) {
      setSent(true);
      return;
    }
    setError(result.error);
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/10 p-5">
        <h2 className="text-lg font-semibold">Revisá tu correo</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Te mandamos un enlace mágico a <strong className="text-foreground">{email}</strong>.
          Tocá el link para entrar al dashboard.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Email</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="min-h-12 w-full rounded-xl border border-line bg-raised px-3 text-base outline-none ring-accent/40 focus:ring-2"
          placeholder="tu@email.com"
        />
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Entrar con magic link"}
      </button>
    </form>
  );
}
