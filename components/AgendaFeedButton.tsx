"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Download, Unlink } from "lucide-react";
import { CopyField } from "@/components/CopyField";
import { googleCalendarSubscribeUrl, toWebcalUrl } from "@/lib/calendar-links";
import { calendarDevice, type CalendarDevice } from "@/lib/pwa-install";

const DESCRIPTION: Record<CalendarDevice, string> = {
  desktop: "Google Calendar, iPhone",
  android: "Google Calendar",
  ios: "Calendario del iPhone",
};

const strong = "font-medium text-foreground";
const primaryLink =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink";
const IOS_MANUAL =
  "Ajustes → Apps → Calendario → Cuentas de calendario → Agregar cuenta → Otra → Agregar calendario suscrito";

export function AgendaFeedButton() {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  // Se detecta en el cliente después del mount para no romper la hidratación.
  const [device, setDevice] = useState<CalendarDevice>("desktop");

  useEffect(() => {
    setDevice(calendarDevice(navigator.userAgent));
  }, []);

  async function create() {
    setBusy(true);
    setDisconnected(false);
    const res = await fetch("/api/admin/agenda-feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create" }),
    });
    const data = (await res.json()) as { url?: string };
    setUrl(data.url ?? null);
    setBusy(false);
  }

  async function revoke() {
    setBusy(true);
    await fetch("/api/admin/agenda-feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke" }),
    });
    setUrl(null);
    setDisconnected(true);
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted">
        Sumá los eventos de tus bots a tu calendario ({DESCRIPTION[device]}). Se
        actualiza solo.
      </p>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => void create()}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-60"
        >
          <CalendarPlus size={16} strokeWidth={1.75} />
          Conectar con mi calendario
        </button>

        {url ? (
          <div className="space-y-3 rounded-2xl bg-chip/60 p-3">
            {device === "android" ? (
              <a
                href={googleCalendarSubscribeUrl(url)}
                target="_blank"
                rel="noopener noreferrer"
                className={primaryLink}
              >
                <CalendarPlus size={16} strokeWidth={1.75} />
                Abrir en Google Calendar
              </a>
            ) : (
              <a href={toWebcalUrl(url)} className={primaryLink}>
                <CalendarPlus size={16} strokeWidth={1.75} />
                Agregar al calendario del iPhone
              </a>
            )}
            <CopyField value={url} label="Copiar link" />
            <ol className="list-decimal space-y-1 pl-5 text-xs leading-5 text-muted">
              {device === "ios" ? (
                <>
                  <li>
                    Tocá el botón y confirmá{" "}
                    <span className={strong}>Suscribirse</span>.
                  </li>
                  <li>Si no se abre, a mano: {IOS_MANUAL} y pegá el link.</li>
                </>
              ) : device === "android" ? (
                <>
                  <li>
                    Tocá{" "}
                    <span className={strong}>Abrir en Google Calendar</span> y
                    confirmá <span className={strong}>Agregar</span>.
                  </li>
                  <li>
                    Si no funciona: abrí{" "}
                    <span className={strong}>calendar.google.com</span> en el
                    navegador → Otros calendarios{" "}
                    <span className={strong}>+</span> →{" "}
                    <span className={strong}>Desde URL</span> y pegá el link.
                  </li>
                  <li>
                    Se sincroniza solo con la app Google Calendar del celu.
                    Puede tardar algunas horas en actualizarse.
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <span className={strong}>iPhone o Mac</span>: tocá el botón
                    y confirmá <span className={strong}>Suscribirse</span>. A
                    mano en el iPhone: {IOS_MANUAL}; en la Mac: Calendario →
                    Archivo → Nueva suscripción a calendario.
                  </li>
                  <li>
                    <span className={strong}>Google Calendar</span> (en la
                    compu): Otros calendarios →{" "}
                    <span className={strong}>Desde URL</span> y pegá el link.
                  </li>
                </>
              )}
            </ol>
            <p className="text-xs text-muted">
              Guardá el link: por seguridad solo se muestra esta vez.
            </p>
          </div>
        ) : null}
      </div>

      <div>
        <a
          href="/api/agenda.ics"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-chip px-4 text-sm font-medium"
        >
          <Download size={16} strokeWidth={1.75} />
          Descargar eventos (.ics)
        </a>
        <p className="mt-1 text-xs text-muted">
          Una sola vez, no se actualiza.
        </p>
      </div>

      <div>
        <button
          type="button"
          onClick={() => void revoke()}
          disabled={busy}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium disabled:opacity-60"
        >
          <Unlink size={16} strokeWidth={1.75} />
          Desconectar link
        </button>
        <p className="mt-1 text-xs text-muted">
          {disconnected
            ? "Listo: el link anterior ya no funciona. Si querés, conectá uno nuevo."
            : "El link que pegaste en tu calendario deja de funcionar."}
        </p>
      </div>
    </div>
  );
}
