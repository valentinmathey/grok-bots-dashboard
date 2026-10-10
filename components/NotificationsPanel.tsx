"use client";

import { useEffect, useState } from "react";
import { Bell, Smartphone, Trash2 } from "lucide-react";
import type { NotificationPrefs, PushType } from "@/lib/push-types";
import { DEFAULT_PUSH_TYPES } from "@/lib/push-types";

const TYPE_LABELS: Record<PushType, string> = {
  new_post: "Post nuevo (por bot)",
  price_drop: "Bajó de precio",
  event_tomorrow: "Evento mañana",
  opportunity_closing: "Oportunidad por cerrar",
  daily_digest: "Digest diario",
};

type Device = {
  id: string;
  endpoint: string;
  user_agent: string | null;
  created_at: string;
  last_success_at: string | null;
  disabled_at: string | null;
};

type BotOpt = { id: string; name: string };

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((ch) => ch.charCodeAt(0)));
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function NotificationsPanel({ bots }: { bots: BotOpt[] }) {
  const [enabled, setEnabled] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    bots: {},
    types: { ...DEFAULT_PUSH_TYPES },
  });
  const [devices, setDevices] = useState<Device[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [iosHint, setIosHint] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/push");
    if (!res.ok) return;
    const data = (await res.json()) as {
      enabled: boolean;
      publicKey: string | null;
      prefs: NotificationPrefs;
      subscriptions: Device[];
    };
    setEnabled(data.enabled);
    setPublicKey(data.publicKey);
    setPrefs(data.prefs);
    setDevices(data.subscriptions.filter((row) => !row.disabled_at));
  }

  useEffect(() => {
    void load();
    setIosHint(isIos() && !isStandalone());
  }, []);

  async function activate() {
    if (!publicKey) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setMessage("Este navegador no soporta notificaciones.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("No se dio permiso.");
        return;
      }
      await navigator.serviceWorker.register("/sw.js").catch(() => undefined);
      const ready = await navigator.serviceWorker.ready;
      const sub = await ready.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      await fetch("/api/admin/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          user_agent: navigator.userAgent,
        }),
      });
      setMessage("Listo. Este dispositivo queda suscripto.");
      await load();
    } catch {
      setMessage("No se pudo activar. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function savePrefs(next: NotificationPrefs) {
    setPrefs(next);
    await fetch("/api/admin/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "prefs", prefs: next }),
    });
  }

  async function sendTest() {
    setBusy(true);
    const res = await fetch("/api/admin/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test" }),
    });
    const data = (await res.json()) as { sent?: number };
    setMessage(data.sent ? "Mandé una prueba." : "No hay dispositivos activos.");
    setBusy(false);
  }

  async function removeDevice(id: string) {
    await fetch("/api/admin/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unsubscribe", id }),
    });
    await load();
  }

  if (!enabled) {
    return (
      <p className="text-sm leading-6 text-muted">
        Faltan las claves VAPID. Generá con{" "}
        <code className="rounded bg-chip px-1.5 py-0.5 text-xs">npx web-push generate-vapid-keys</code>{" "}
        y cargá <code className="text-xs">VAPID_PUBLIC_KEY</code>,{" "}
        <code className="text-xs">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code>,{" "}
        <code className="text-xs">VAPID_PRIVATE_KEY</code> y{" "}
        <code className="text-xs">VAPID_SUBJECT</code>.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {iosHint ? (
        <p className="rounded-2xl bg-raised px-3 py-2.5 text-sm leading-6">
          En iPhone las notificaciones andan si instalás la app (iOS 16.4+): Compartir → Agregar a
          inicio.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void activate()}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          <Bell size={16} strokeWidth={1.75} />
          Activar notificaciones
        </button>
        <button
          type="button"
          onClick={() => void sendTest()}
          disabled={busy}
          className="inline-flex min-h-11 items-center rounded-full bg-chip px-4 text-sm font-medium"
        >
          Enviar prueba
        </button>
      </div>
      {message ? <p className="text-sm text-muted">{message}</p> : null}

      <section>
        <h2 className="text-sm font-semibold">Tipos</h2>
        <ul className="mt-2 space-y-2">
          {(Object.keys(TYPE_LABELS) as PushType[]).map((type) => (
            <li key={type}>
              <label className="flex min-h-10 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.types[type] !== false}
                  onChange={(event) =>
                    void savePrefs({
                      ...prefs,
                      types: { ...prefs.types, [type]: event.target.checked },
                    })
                  }
                />
                {TYPE_LABELS[type]}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Bots</h2>
        <ul className="mt-2 space-y-2">
          {bots.map((bot) => (
            <li key={bot.id}>
              <label className="flex min-h-10 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.bots[bot.id] !== false}
                  onChange={(event) =>
                    void savePrefs({
                      ...prefs,
                      bots: { ...prefs.bots, [bot.id]: event.target.checked },
                    })
                  }
                />
                {bot.name}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold">Dispositivos</h2>
        {devices.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Ninguno todavía.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {devices.map((device) => (
              <li
                key={device.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <Smartphone size={14} strokeWidth={1.75} className="shrink-0 text-muted" />
                  <span className="truncate">{device.user_agent || device.endpoint}</span>
                </span>
                <button
                  type="button"
                  onClick={() => void removeDevice(device.id)}
                  className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-chip"
                  aria-label="Quitar dispositivo"
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
