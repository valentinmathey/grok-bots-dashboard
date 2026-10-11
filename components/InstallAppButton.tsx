"use client";

import { useEffect, useState } from "react";
import { Share, Smartphone } from "lucide-react";
import {
  canNativeInstall,
  isAppInstalled,
  isIosDevice,
  promptNativeInstall,
  subscribeInstall,
} from "@/lib/pwa-install";

export function InstallAppButton({
  className = "",
}: {
  className?: string;
}) {
  const [installed, setInstalled] = useState(false);
  const [native, setNative] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    setInstalled(isAppInstalled());
    setNative(canNativeInstall());
    return subscribeInstall(() => setNative(canNativeInstall()));
  }, []);

  if (installed) return null;

  async function install() {
    if (await promptNativeInstall()) return;
    if (isIosDevice()) setIosHelp(true);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void install()}
        className={
          className ||
          "flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium hover:bg-chip"
        }
      >
        <Smartphone size={18} strokeWidth={1.75} />
        Instalar app
      </button>
      {iosHelp ? (
        <p className="mt-2 px-3 text-xs leading-5 text-muted">
          En Safari: tocá <Share size={12} className="inline" strokeWidth={1.75} /> Compartir y
          después <span className="font-medium text-foreground">Agregar a inicio</span>.
        </p>
      ) : null}
    </div>
  );
}
