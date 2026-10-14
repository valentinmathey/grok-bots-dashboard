"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";

const DEBOUNCE_MS = 300;

/**
 * Input del buscador con debounce: actualiza ?q= sin recargar. Mientras llega la
 * respuesta, los resultados anteriores quedan atenuados y se ve un spinner.
 */
export function BuscarLive({
  initialQ,
  toolbar,
  children,
}: {
  initialQ: string;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(initialQ);
  const [pending, startTransition] = useTransition();
  const [waiting, setWaiting] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const trimmed = value.trim();
    if (trimmed === (params.get("q") ?? "")) {
      setWaiting(false);
      return;
    }
    setWaiting(true);
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (trimmed) next.set("q", trimmed);
      else next.delete("q");
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
      setWaiting(false);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const loading = pending || waiting;

  return (
    <>
      <form
        className="relative mt-3"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <Search
          size={16}
          strokeWidth={1.75}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          name="q"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="n8n, Camboriu, logitech…"
          autoComplete="off"
          enterKeyHint="search"
          aria-busy={loading}
          className="min-h-11 w-full rounded-full border border-line bg-card pl-10 pr-10 text-base sm:text-sm"
        />
        {loading ? (
          <Loader2
            size={16}
            strokeWidth={1.75}
            aria-label="Buscando"
            className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted"
          />
        ) : null}
      </form>
      {toolbar ? <div className="mt-4">{toolbar}</div> : null}
      <div
        aria-live="polite"
        className={`mt-5 space-y-3 transition-opacity duration-200 ${loading ? "pointer-events-none opacity-50" : "opacity-100"}`}
      >
        {children}
      </div>
    </>
  );
}
