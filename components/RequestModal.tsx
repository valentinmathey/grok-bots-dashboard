"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import { ChipRow, FilterChip } from "@/components/FilterChip";
import { Sheet } from "@/components/Sheet";
import { showToast } from "@/components/Toast";
import type { PostCardBot } from "@/components/PostCardHeader";
import type { BotRequest, RequestMessage, RequestStatus } from "@/lib/requests";

const CHIPS = ["Profundizá", "Buscá más así", "Actualizá", "Otra cosa…"] as const;
const OPEN_STATUSES: RequestStatus[] = ["pendiente", "en_progreso"];

const STATUS_LABEL: Record<RequestStatus, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  respondido: "Respondido",
  descartado: "Descartado",
};

type RequestWithMessages = BotRequest & { messages?: RequestMessage[] };

const countCache = new Map<string, number>();
const countListeners = new Set<() => void>();
let countsPromise: Promise<void> | null = null;

function notifyCounts() {
  for (const listener of countListeners) listener();
}

function loadOpenCounts() {
  countsPromise ??= fetch("/api/admin/requests")
    .then((res) => (res.ok ? res.json() : { requests: [] }))
    .then((data: { requests?: RequestWithMessages[] }) => {
      countCache.clear();
      for (const row of data.requests ?? []) {
        if (!row.post_id || !OPEN_STATUSES.includes(row.status)) continue;
        countCache.set(row.post_id, (countCache.get(row.post_id) ?? 0) + 1);
      }
      notifyCounts();
    })
    .catch(() => undefined);
  return countsPromise;
}

export function useOpenRequestCount(postId: string) {
  const [count, setCount] = useState(countCache.get(postId) ?? 0);
  useEffect(() => {
    const sync = () => setCount(countCache.get(postId) ?? 0);
    countListeners.add(sync);
    void loadOpenCounts().then(sync);
    return () => {
      countListeners.delete(sync);
    };
  }, [postId]);
  return count;
}

function bumpOpenCount(postId: string) {
  countCache.set(postId, (countCache.get(postId) ?? 0) + 1);
  notifyCounts();
}

export function RequestButton({
  postId,
  botId,
  postTitle,
  bot,
}: {
  postId: string;
  botId: string;
  postTitle: string;
  bot?: PostCardBot | null;
}) {
  const [open, setOpen] = useState(false);
  const count = useOpenRequestCount(postId);

  return (
    <>
      <button
        type="button"
        data-no-collapse
        aria-label="Pedirle al bot"
        title="Pedirle al bot"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-chip hover:text-foreground"
      >
        <MessageSquarePlus size={16} strokeWidth={1.75} />
        {count > 0 ? (
          <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-ink">
            {count}
          </span>
        ) : null}
      </button>
      <RequestModal
        open={open}
        onClose={() => setOpen(false)}
        postId={postId}
        botId={botId}
        postTitle={postTitle}
        bot={bot}
      />
    </>
  );
}

function RequestModal({
  open,
  onClose,
  postId,
  botId,
  postTitle,
  bot,
}: {
  open: boolean;
  onClose: () => void;
  postId: string;
  botId: string;
  postTitle: string;
  bot?: PostCardBot | null;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previous, setPrevious] = useState<RequestWithMessages[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const frame = window.requestAnimationFrame(() => textareaRef.current?.focus());
    void fetch(`/api/admin/requests?post=${encodeURIComponent(postId)}`)
      .then((res) => (res.ok ? res.json() : { requests: [] }))
      .then((data: { requests?: RequestWithMessages[] }) => {
        setPrevious(data.requests ?? []);
      })
      .catch(() => undefined);
    return () => window.cancelAnimationFrame(frame);
  }, [open, postId]);

  async function submit() {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_id: botId, post_id: postId, body: text }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error || "No se pudo enviar el pedido.");
        return;
      }
      setBody("");
      bumpOpenCount(postId);
      showToast("Pedido enviado");
      onClose();
    } catch {
      setError("No se pudo enviar el pedido.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Pedirle al bot" desktopDialog>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            {bot ? <BotAvatar bot={bot} size="sm" /> : null}
            <div className="min-w-0">
              <p className="text-sm font-semibold">{bot?.name ?? "Bot"}</p>
              <p className="mt-0.5 text-sm leading-5 text-muted">{postTitle}</p>
            </div>
          </div>

          {previous.length ? (
            <ul className="space-y-2">
              {previous.map((row) => {
                const reply = [...(row.messages ?? [])]
                  .reverse()
                  .find((message) => message.author === "bot");
                return (
                  <li key={row.id} className="rounded-2xl bg-raised px-3 py-2 text-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="min-w-0 truncate">{row.body}</p>
                      <span className="shrink-0 text-[11px] font-medium text-muted">
                        {STATUS_LABEL[row.status]}
                      </span>
                    </div>
                    {reply ? (
                      <p className="mt-1 text-xs leading-5 text-muted">{reply.body}</p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}

          <ChipRow>
            {CHIPS.map((chip) => (
              <FilterChip
                key={chip}
                size="sm"
                selected={chip !== "Otra cosa…" && body === chip}
                onClick={() => setBody(chip === "Otra cosa…" ? "" : chip)}
              >
                {chip}
              </FilterChip>
            ))}
          </ChipRow>

          <textarea
            ref={textareaRef}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-line bg-card px-3 py-2 text-sm"
            placeholder="profundizame esto…"
          />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-line text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={sending || !body.trim()}
              onClick={() => void submit()}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-ink disabled:opacity-60"
            >
              {sending ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </div>
      </Sheet>
  );
}
