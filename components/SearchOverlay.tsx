"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import { KindBadge } from "@/components/KindBadge";
import type { SearchHit } from "@/lib/search";

const RECENT_KEY = "gb-recent-searches";

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  const next = [q, ...loadRecent().filter((item) => item !== q)].slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  const run = useCallback(async (value: string) => {
    if (value.trim().length < 2) {
      setHits([]);
      return;
    }
    const res = await fetch(`/api/admin/search?q=${encodeURIComponent(value.trim())}`);
    if (!res.ok) return;
    const data = (await res.json()) as { hits: SearchHit[] };
    setHits(data.hits);
    saveRecent(value.trim());
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "/" && !event.metaKey && !event.ctrlKey) {
        const target = event.target as HTMLElement | null;
        if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
        event.preventDefault();
        setOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    setRecent(loadRecent());
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => void run(q), 250);
    return () => window.clearTimeout(handle);
  }, [q, open, run]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar"
        title="Buscar"
        className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-chip hover:text-foreground"
      >
        <Search size={18} strokeWidth={1.75} />
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/40 px-0 sm:px-6 sm:py-16">
          <div
            role="dialog"
            aria-modal
            aria-labelledby={titleId}
            className="mx-auto flex h-full max-w-xl flex-col bg-background sm:h-auto sm:max-h-[80vh] sm:rounded-3xl sm:border sm:border-line"
          >
            <div className="flex items-center gap-2 border-b border-line px-3 py-3">
              <Search size={18} strokeWidth={1.75} className="text-muted" />
              <input
                ref={inputRef}
                id={titleId}
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Buscar posts…"
                className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-chip"
                aria-label="Cerrar"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {q.trim().length < 2 && recent.length ? (
                <div className="space-y-1">
                  <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Recientes
                  </p>
                  {recent.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setQ(item)}
                      className="block w-full rounded-2xl px-3 py-2 text-left text-sm hover:bg-chip"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : null}
              {q.trim().length >= 2 && hits.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-muted">Nada con “{q}”.</p>
              ) : null}
              <ul className="space-y-1.5">
                {hits.map((hit) => (
                  <li key={hit.id}>
                    <Link
                      href={hit.url}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 rounded-2xl px-2 py-2 hover:bg-chip"
                    >
                      <BotAvatar bot={hit.bot} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">{hit.title}</p>
                          <KindBadge kind={hit.kind} />
                        </div>
                        <p
                          className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted [&_mark]:rounded [&_mark]:bg-accent/20 [&_mark]:px-0.5 [&_mark]:text-foreground"
                          dangerouslySetInnerHTML={{ __html: hit.snippet }}
                        />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {q.trim().length >= 2 ? (
                <p className="mt-3 px-2">
                  <Link
                    href={`/buscar?q=${encodeURIComponent(q.trim())}`}
                    onClick={() => setOpen(false)}
                    className="text-xs font-medium text-accent"
                  >
                    Ver todos en /buscar
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
