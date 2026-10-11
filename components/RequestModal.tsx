"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import { ChipRow, FilterChip } from "@/components/FilterChip";
import { Sheet } from "@/components/Sheet";
import { showToast } from "@/components/Toast";
import type { PostCardBot } from "@/components/PostCardHeader";
import type { BotRequest, RequestMessage, RequestStatus } from "@/lib/requests";

const POST_CHIPS = ["Profundizá", "Buscá más así", "Actualizá", "Otra cosa…"] as const;
const GENERAL_CHIPS = ["Buscame...", "Cambiá cómo publicás...", "Revisá...", "Otra cosa…"] as const;
const OTHER_CHIP = "Otra cosa…";
const OPEN_STATUSES: RequestStatus[] = ["pendiente", "en_progreso"];

const STATUS_LABEL: Record<RequestStatus, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  respondido: "Respondido",
  descartado: "Descartado",
};

type RequestWithMessages = BotRequest & { messages?: RequestMessage[] };

/** Clave del contador de abiertos: el post, o `general:<botId>` para pedidos generales. */
function countKey(row: { post_id: string | null; bot_id: string }) {
  return row.post_id ?? `general:${row.bot_id}`;
}

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
        if (!OPEN_STATUSES.includes(row.status)) continue;
        const key = countKey(row);
        countCache.set(key, (countCache.get(key) ?? 0) + 1);
      }
      notifyCounts();
    })
    .catch(() => undefined);
  return countsPromise;
}

export function useOpenRequestCount(key: string) {
  const [count, setCount] = useState(countCache.get(key) ?? 0);
  useEffect(() => {
    const sync = () => setCount(countCache.get(key) ?? 0);
    countListeners.add(sync);
    void loadOpenCounts().then(sync);
    return () => {
      countListeners.delete(sync);
    };
  }, [key]);
  return count;
}

function bumpOpenCount(key: string) {
  countCache.set(key, (countCache.get(key) ?? 0) + 1);
  notifyCounts();
}

/** Pedido general al bot (sin post): botón con label para el header del panel. */
export function GeneralRequestButton({
  bot,
  className = "",
}: {
  bot: PostCardBot;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const count = useOpenRequestCount(`general:${bot.id}`);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={count > 0 ? `Pedirle algo (${count} abiertos)` : "Pedirle algo"}
        className={`relative min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-chip ${className}`}
      >
        <MessageSquarePlus size={15} strokeWidth={1.75} className="text-accent" />
        Pedirle algo
        {count > 0 ? (
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-ink">
            {count}
          </span>
        ) : null}
      </button>
      <RequestModal open={open} onClose={() => setOpen(false)} botId={bot.id} bot={bot} />
    </>
  );
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
  postId = null,
  botId,
  postTitle,
  bot,
}: {
  open: boolean;
  onClose: () => void;
  /** Sin post = pedido general al bot. */
  postId?: string | null;
  botId: string;
  postTitle?: string;
  bot?: PostCardBot | null;
}) {
  const general = !postId;
  const chips = general ? GENERAL_CHIPS : POST_CHIPS;
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previous, setPrevious] = useState<RequestWithMessages[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const frame = window.requestAnimationFrame(() => textareaRef.current?.focus());
    const query = postId
      ? `post=${encodeURIComponent(postId)}`
      : `bot=${encodeURIComponent(botId)}&scope=general`;
    void fetch(`/api/admin/requests?${query}`)
      .then((res) => (res.ok ? res.json() : { requests: [] }))
      .then((data: { requests?: RequestWithMessages[] }) => {
        setPrevious(data.requests ?? []);
      })
      .catch(() => undefined);
    return () => window.cancelAnimationFrame(frame);
  }, [open, postId, botId]);

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
      bumpOpenCount(countKey({ post_id: postId, bot_id: botId }));
      showToast("Pedido enviado");
      onClose();
    } catch {
      setError("No se pudo enviar el pedido.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={general ? "Pedirle algo" : "Pedirle al bot"} desktopDialog>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            {bot ? <BotAvatar bot={bot} size="sm" /> : null}
            <div className="min-w-0">
              <p className="text-sm font-semibold">{bot?.name ?? "Bot"}</p>
              <p className="mt-0.5 text-sm leading-5 text-muted">
                {general ? "Pedido general" : postTitle}
              </p>
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
            {chips.map((chip) => (
              <FilterChip
                key={chip}
                size="sm"
                selected={chip !== OTHER_CHIP && body === chip}
                onClick={() => {
                  setBody(chip === OTHER_CHIP ? "" : chip.replace(/\.\.\.$/, " "));
                  textareaRef.current?.focus();
                }}
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
            maxLength={2000}
            placeholder={general ? "buscame eventos de IA este mes…" : "profundizame esto…"}
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
